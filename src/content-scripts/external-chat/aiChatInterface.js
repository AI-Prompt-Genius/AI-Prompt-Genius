class ProxyFetchRequester {
    async findExistingProxyTab() {
        const tabs = await chrome.tabs.query({ pinned: true });
        const results = await Promise.all(
            tabs.map(async (tab) => {
                if (tab.url) {
                    return tab.url;
                }
                return chrome.tabs.sendMessage(tab.id, 'url').catch(() => undefined);
            }),
        );

        for (let i = 0; i < results.length; i++) {
            if (results[i] && results[i].startsWith('https://chat.openai.com')) {
                return tabs[i];
            }
        }
    }

    waitForProxyTabReady(onReady) {
        chrome.runtime.onMessage.addListener(async function listener(message, sender) {
            if (message.event === 'PROXY_TAB_READY') {
                console.debug('new proxy tab ready');
                chrome.runtime.onMessage.removeListener(listener);
                onReady(sender.tab);
            }
        });
    }

    async createProxyTab() {
        return new Promise((resolve) => {
            this.waitForProxyTabReady(resolve);
            chrome.tabs.create({ url: CHATGPT_HOME_URL, pinned: true });
        });
    }

    async getProxyTab() {
        let tab = await this.findExistingProxyTab();
        if (!tab) {
            tab = await this.createProxyTab();
        }
        return tab;
    }

    async refreshProxyTab() {
        const tab = await this.findExistingProxyTab();
        if (!tab) {
            await this.createProxyTab();
            return;
        }
        return new Promise((resolve) => {
            this.waitForProxyTabReady(resolve);
            chrome.tabs.reload(tab.id);
        });
    }

    async fetch(url, options) {
        const tab = await this.getProxyTab();
        const resp = await proxyFetch(tab.id, url, options);
        if (resp.status === 403) {
            await this.refreshProxyTab();
            return proxyFetch(tab.id, url, options);
        }
        return resp;
    }
}

class GlobalFetchRequester {
    fetch(url, options) {
        return fetch(url, options);
    }
}

class ChatGPTClient {
    constructor() {
        this.requester = new GlobalFetchRequester();
        const proxyFetchRequester = new ProxyFetchRequester();

        proxyFetchRequester.findExistingProxyTab().then((tab) => {
            if (tab) {
                this.switchRequester(proxyFetchRequester);
            }
        });
    }

    switchRequester(newRequester) {
        console.debug('client switchRequester', newRequester);
        this.requester = newRequester;
    }

    async fetch(url, options) {
        return this.requester.fetch(url, options);
    }

    async getAccessToken() {
        const resp = await this.fetch('https://chat.openai.com/api/auth/session');
        if (resp.status === 403) {
            throw new ChatError('Please pass Cloudflare check', ErrorCode.CHATGPT_CLOUDFLARE);
        }
        const data = await resp.json().catch(() => ({}));
        if (!data.accessToken) {
            throw new ChatError('UNAUTHORIZED', ErrorCode.CHATGPT_UNAUTHORIZED);
        }
        return data.accessToken;
    }

    async requestBackendAPIWithToken(token, method, path, data) {
        return this.fetch(`https://chat.openai.com/backend-api${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    }

    async getModels(token) {
        const resp = await this.requestBackendAPIWithToken(token, 'GET', '/models').then((r) => r.json());
        return resp.models;
    }

    async fixAuthState() {
        if (this.requester === proxyFetchRequester) {
            await proxyFetchRequester.refreshProxyTab();
        } else {
            await proxyFetchRequester.getProxyTab();
            this.switchRequester(proxyFetchRequester);
        }
    }
}


class ChatError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

const ChatGPTWebModel = {
    'GPT-3.5': 'gpt-3.5',
    'GPT-4': 'gpt-4'
};

const ErrorCode = {
    CONVERSATION_LIMIT: 'CONVERSATION_LIMIT',
    UNKOWN_ERROR: 'UNKOWN_ERROR',
    CHATGPT_CLOUDFLARE: 'CHATGPT_CLOUDFLARE',
    CHATGPT_UNAUTHORIZED: 'CHATGPT_UNAUTHORIZED',
    CHATGPT_AUTH: 'CHATGPT_AUTH',
    GPT4_MODEL_WAITLIST: 'GPT4_MODEL_WAITLIST',
    API_KEY_NOT_SET: 'API_KEY_NOT_SET',
    MISSING_HOST_PERMISSION: 'MISSING_HOST_PERMISSION',
    NETWORK_ERROR: 'NETWORK_ERROR',
    LMSYS_SESSION_EXPIRED: 'LMSYS_SESSION_EXPIRED',
    CHATGPT_INSUFFICIENT_QUOTA: 'CHATGPT_INSUFFICIENT_QUOTA'
};

class AbstractBot {
    async sendMessage(params) {
        try {
            await this.doSendMessage(params);
        } catch (err) {
            if (err instanceof ChatError) {
                params.onEvent({ type: 'ERROR', error: err });
            } else if (!params.signal?.aborted) {
                params.onEvent({
                    type: 'ERROR',
                    error: new ChatError(err.message, ErrorCode.UNKOWN_ERROR)
                });
            }
        }
    }

    get name() {
        return undefined;
    }
}

async function fetchArkoseToken() {
    try {
        const resp = await fetch('https://ai.fakeopen.com/api/arkose/token');
        return resp.token;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

async function* streamAsyncIterable(stream) {
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Creates a new EventSource parser.
 *
 * @param onParse - Callback to invoke when a new event is parsed, or a new reconnection interval
 *                  has been sent from the server
 *
 * @returns A new EventSource parser, with `parse` and `reset` methods.
 * @public
 */
function createParser(onParse) {
    // Processing state
    let isFirstChunk;
    let buffer;
    let startingPosition;
    let startingFieldLength;

    // Event state
    let eventId;
    let eventName;
    let data;

    reset();
    return { feed, reset };

    function reset() {
        isFirstChunk = true;
        buffer = '';
        startingPosition = 0;
        startingFieldLength = -1;

        eventId = undefined;
        eventName = undefined;
        data = '';
    }

    function feed(chunk) {
        buffer = buffer ? buffer + chunk : chunk;

        // Strip any UTF8 byte order mark (BOM) at the start of the stream.
        // Note that we do not strip any non - UTF8 BOM, as eventsource streams are
        // always decoded as UTF8 as per the specification.
        if (isFirstChunk && hasBom(buffer)) {
            buffer = buffer.slice(BOM.length);
        }

        isFirstChunk = false;

        // Set up chunk-specific processing state
        const length = buffer.length;
        let position = 0;
        let discardTrailingNewline = false;

        // Read the current buffer byte by byte
        while (position < length) {
            // EventSource allows for carriage return + line feed, which means we
            // need to ignore a linefeed character if the previous character was a
            // carriage return
            // @todo refactor to reduce nesting, consider checking previous byte?
            // @todo but consider multiple chunks etc
            if (discardTrailingNewline) {
                if (buffer[position] === '\n') {
                    ++position;
                }
                discardTrailingNewline = false;
            }

            let lineLength = -1;
            let fieldLength = startingFieldLength;
            let character;

            for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
                character = buffer[index];
                if (character === ':' && fieldLength < 0) {
                    fieldLength = index - position;
                } else if (character === '\r') {
                    discardTrailingNewline = true;
                    lineLength = index - position;
                } else if (character === '\n') {
                    lineLength = index - position;
                }
            }

            if (lineLength < 0) {
                startingPosition = length - position;
                startingFieldLength = fieldLength;
                break;
            } else {
                startingPosition = 0;
                startingFieldLength = -1;
            }

            parseEventStreamLine(buffer, position, fieldLength, lineLength);

            position += lineLength + 1;
        }

        if (position === length) {
            // If we consumed the entire buffer to read the event, reset the buffer
            buffer = '';
        } else if (position > 0) {
            // If there are bytes left to process, set the buffer to the unprocessed
            // portion of the buffer only
            buffer = buffer.slice(position);
        }
    }

    function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
        if (lineLength === 0) {
            // We reached the last line of this event
            if (data.length > 0) {
                onParse({
                    type: 'event',
                    id: eventId,
                    event: eventName || undefined,
                    data: data.slice(0, -1), // remove trailing newline
                });

                data = '';
                eventId = undefined;
            }
            eventName = undefined;
            return;
        }

        const noValue = fieldLength < 0;
        const field = lineBuffer.slice(index, index + (noValue ? lineLength : fieldLength));
        let step = 0;

        if (noValue) {
            step = lineLength;
        } else if (lineBuffer[index + fieldLength + 1] === ' ') {
            step = fieldLength + 2;
        } else {
            step = fieldLength + 1;
        }

        const position = index + step;
        const valueLength = lineLength - step;
        const value = lineBuffer.slice(position, position + valueLength).toString();

        if (field === 'data') {
            data += value ? `${value}\n` : '\n';
        } else if (field === 'event') {
            eventName = value;
        } else if (field === 'id' && !value.includes('\u0000')) {
            eventId = value;
        } else if (field === 'retry') {
            const retry = parseInt(value, 10);
            if (!Number.isNaN(retry)) {
                onParse({ type: 'reconnect-interval', value: retry });
            }
        }
    }
}

const BOM = [239, 187, 191];

function hasBom(buffer) {
    return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
}


async function parseSSEResponse(resp, onMessage) {
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        if (error) {
            throw new Error(JSON.stringify(error));
        }
        throw new ChatError(`${resp.status} ${resp.statusText}`, ErrorCode.NETWORK_ERROR);
    }
    const parser = createParser(event => {
        if (event.type === 'event') {
            onMessage(event.data);
        }
    });
    const decoder = new TextDecoder();
    for await (const chunk of streamAsyncIterable(resp.body)) {
        const str = decoder.decode(chunk);
        parser.feed(str);
    }
}

function removeCitations(text) {
    return text.replaceAll(/\u3010\d+\u2020source\u3011/g, '');
}

function uuidv4(){
    return self.crypto.randomUUID();
}

class ChatGPTWebBot extends AbstractBot {
    constructor(model) {
        super();
        this.model = model;
        this.chatGPTClient = new ChatGPTClient()
    }

    async getModelName() {
        if (this.model === ChatGPTWebModel['GPT-4']) {
            return 'gpt-4';
        }
        return 'text-davinci-002-render-sha';
    }

    async doSendMessage(params) {
        if (!this.accessToken) {
            this.accessToken = await this.chatGPTClient.getAccessToken();
        }
        const modelName = await this.getModelName();
        console.debug('Using model:', modelName);

        let arkoseToken;
        if (modelName.startsWith('gpt-4')) {
           arkoseToken = await fetchArkoseToken();
        }

        const resp = await this.chatGPTClient.fetch('https://chat.openai.com/backend-api/conversation', {
            method: 'POST',
            signal: params.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({
                action: 'next',
                messages: [
                    {
                        id: uuidv4(),
                        author: { role: 'user' },
                        content: {
                            content_type: 'text',
                            parts: [params.prompt]
                        }
                    }
                ],
                model: modelName,
                conversation_id: this.conversationContext?.conversationId || undefined,
                parent_message_id: this.conversationContext?.lastMessageId || uuidv4(),
                //arkose_token: arkoseToken
            })
        });

        await parseSSEResponse(resp, message => {
            console.debug('chatgpt sse message', message);
            if (message === '[DONE]') {
                params.onEvent({ type: 'DONE' });
                return;
            }
            let data;
            try {
                data = JSON.parse(message);
            } catch (err) {
                console.error(err);
                return;
            }
            const content = data.message?.content;
            if (!content) {
                return;
            }
            let text;
            if (content.content_type === 'text') {
                text = content.parts[0];
                text = removeCitations(text);
            } else if (content.content_type === 'code') {
                text = '_' + content.text + '_';
            } else {
                return;
            }
            if (text) {
                this.conversationContext = {
                    conversationId: data.conversation_id,
                    lastMessageId: data.message.id
                };
                params.onEvent({
                    type: 'UPDATE_ANSWER',
                    data: { text }
                });
            }
        }).catch(err => {
            if (err.message.includes('token_expired')) {
                throw new ChatError(err.message, ErrorCode.CHATGPT_AUTH);
            }
            throw err;
        });
    }

    resetConversation() {
        this.conversationContext = undefined;
    }

    get name() {
        return `ChatGPT (webapp/${this.model})`;
    }
}

const webBot = new ChatGPTWebBot('gpt-4');
const abortController = new AbortController()

const input = "Hello there! What can you do?"

async function main() {
    await webBot.sendMessage({
        prompt: input,
        signal: abortController.signal,
        onEvent(event) {
            console.log(event)
        },
    })
}
main()

