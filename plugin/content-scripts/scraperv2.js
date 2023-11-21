async function startSyncer() {
  await new Promise((r) => setTimeout(r, 1000)); // 1s sleep
  let convo;
  const SAVE_CONVO_INTERVAL = 10000; //10s
  chrome.storage.local.get({ auth: null }, async function (result) {
    let auth = result.auth;
    setInterval(() => saveConvo(auth), SAVE_CONVO_INTERVAL);
  });

  async function saveConvo(auth) {
    const urlSegments = window.location.pathname.split("/");
    let conversation_id = urlSegments[urlSegments.length - 1]; // extract conversation ID from URL
    if (!conversation_id === "") {
      convo = conversation_id;
    } else {
      let latestConvos = await getConversations(0, 1, auth);
      convo = latestConvos.items[0].id;
    }
    chrome.storage.local.get({ threads: [] }, async function (result) {
      let threads = result.threads;
      let ids = [];
      for (let thread of threads) {
        ids.push(thread.id);
      }
      resyncArray([convo], ids, threads, 0, myAuth);
      firstTime = false;
    });
  }
}

let intro;
let auto_send;
let disable = false;
let buttons;
let defaults = {
  buttons: true,
  auto_send: false,
  disable_history: false,
  auto_delete: false,
  message:
    'The following is a transcript of a conversation between me and ChatGPT. Use it for context in the rest of the conversation. Be ready to edit and build upon the responses previously given by ChatGPT. Respond "ready!" if you understand the context. Do not respond wit anything else. Conversation:\n',
};
chrome.storage.local.get({ settings: defaults }, function (result) {
  let settings = result.settings;
  buttons = settings.buttons ?? true;
  intro = settings.message;
  auto_send = settings.auto_send ?? false;
  if (
    settings.hasOwnProperty("disable_history") &&
    settings.disable_history === true
  ) {
    disable = true;
    //console.log("SCRAPER DISABLED!")
  }
  //console.log(disable)
  start();
});

function start() {
  if (disable === false) {
    startSyncer();
  }
}

function continue_convo(convo) {
  const input = document.querySelector("textarea");
  input.style.height = "200px";
  const button = input.parentElement.querySelector("button");
  input.value = `${intro} ${convo}`;
  if (auto_send) {
    button.click();
  }
}

function use_prompt(prompt) {
  const input = document.querySelector("textarea");
  input.style.height = "200px";
  const button = input.parentElement.querySelector("button");
  input.value = `${prompt}`;
  if (auto_send) {
    button.click();
  }
}

// listen for messages
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "c_continue_convo") {
    //console.log("message recieved!")
    continue_convo(JSON.stringify(request.convo));
  }
});
