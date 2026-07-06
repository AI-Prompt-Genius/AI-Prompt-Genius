import type { LegacyPrompt } from "../../types"

// Generous storage caps to discourage abuse without getting in a normal user's way. Prompts are
// mirrored into localStorage (a few MB quota), so these keep the whole library well under it.
export const MAX_PROMPT_TEXT_LENGTH = 50_000 // characters in a single prompt's body
export const MAX_PROMPTS = 5_000 // total prompts
export const MAX_PROMPTS_TOTAL_BYTES = 4_000_000 // ~4 MB of serialized prompts

/**
 * Returns a human-readable reason the given prompt can't be saved (too long / too many / library
 * too big), or null when it's within limits. `editingId` excludes the prompt being edited from the
 * count so re-saving an existing prompt never trips the count cap.
 */
export function promptLimitError(text: string, editingId?: string): string | null {
    if ((text?.length ?? 0) > MAX_PROMPT_TEXT_LENGTH) {
        return `This prompt is too long (limit ${MAX_PROMPT_TEXT_LENGTH.toLocaleString()} characters).`
    }
    const prompts: LegacyPrompt[] = getObject("prompts", [])
    const others = prompts.filter(p => p.id !== editingId)
    if (others.length + 1 > MAX_PROMPTS) {
        return `You've reached the maximum of ${MAX_PROMPTS.toLocaleString()} prompts.`
    }
    const bytes = JSON.stringify(others).length + (text?.length ?? 0)
    if (bytes > MAX_PROMPTS_TOTAL_BYTES) {
        return "Storage limit reached. Please delete some prompts before adding more."
    }
    return null
}

export function findVariables(str: string): string[] {
    // thanks chatgpt
    const regex = /{{(.+?)}}/g
    const matches = new Set<string>()
    let match: RegExpExecArray | null
    while ((match = regex.exec(str))) {
        matches.add(match[1])
    }
    return Array.from(matches)
}

function getObjectIndexByID(id: string, list: Array<{ id?: string }>): number {
    // created by ChatGPT
    // Iterate over the list of objects
    for (let i = 0; i < list.length; i++) {
        const obj = list[i]

        // Check if the object has an `id` property that matches the given id
        if (obj.id && obj.id === id) {
            // If a match is found, return the object
            return i
        }
    }

    // If no match is found, return null (preserved legacy behavior)
    return null as unknown as number
}

export function setObject(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value))
}

export function getObject(key: string, defaultValue: any): any {
    // Reads are pure. The Ctrl+Shift+P picker mirror (`sync_prompts`) is now posted on write
    // and on store init/reload (see usePromptStore), not as a hidden read side effect.
    var value = localStorage.getItem(key)
    return value ? value && JSON.parse(value) : defaultValue
}

export function sendMessageToParent(messageObj: unknown): void {
    // Stringify the object to send via postMessage
    var messageString = JSON.stringify(messageObj)

    // Send the message to the parent window
    window.parent.postMessage(messageString, "*")
}

export function getCurrentTimestamp(): number {
    const currentDate = new Date()
    return currentDate.getTime() // Returns the timestamp in milliseconds since January 1, 1970 (Unix timestamp).
}

export function deletePrompt(id: string, prompts: LegacyPrompt[] | null = null): LegacyPrompt[] {
    if (!prompts) {
        prompts = getObject("prompts", [])
    }

    let promptIndex = getObjectIndexByID(id, prompts as LegacyPrompt[])

    let deletedPrompts = getObject("deletedPrompts", [])
    setObject("deletedPrompts", [...deletedPrompts, id])

    if (promptIndex !== -1) {
        ;(prompts as LegacyPrompt[]).splice(promptIndex, 1) // Remove the prompt at the specified index
    }

    return prompts as LegacyPrompt[]
}

export function newBlankPrompt(promptObj: LegacyPrompt): LegacyPrompt[] {
    let prompts = getObject("prompts", [])

    const newPrompts = getObject("newPrompts", [])
    setObject("newPrompts", [...newPrompts, promptObj.id])

    prompts.unshift(promptObj)
    return prompts
}

export function newFilteredPrompt(
    promptObj: LegacyPrompt,
    prompts: LegacyPrompt[],
): LegacyPrompt[] {
    prompts.unshift(promptObj)
    return prompts
}

export function newFolder(name: string): string[] {
    let folders: string[] = getObject("folders", [])

    if (!folders.includes(name)) {
        folders.push(name)
    }

    return folders
}

export function editFilteredPrompts(
    id: string,
    editedPrompt: LegacyPrompt,
    promptList: LegacyPrompt[],
): LegacyPrompt[] {
    let promptIndex = getObjectIndexByID(id, promptList)
    promptList[promptIndex] = editedPrompt
    return promptList
}

export function checkProperties(obj: unknown, properties: string[]): boolean {
    return properties.every(prop => Object.prototype.hasOwnProperty.call(obj, prop))
}

export function editPrompt(id: string, promptObj: LegacyPrompt): LegacyPrompt[] {
    let prompts: LegacyPrompt[] = getObject("prompts", [])
    let promptIndex = getObjectIndexByID(id, prompts)
    prompts[promptIndex] = promptObj
    prompts[promptIndex].lastChanged = getCurrentTimestamp()

    let changedPrompts = getObject("changedPrompts", [])
    setObject("changedPrompts", [...changedPrompts, id])

    return prompts
}

export function removeFolderFromPrompts(name: string): LegacyPrompt[] {
    let prompts: LegacyPrompt[] = getObject("prompts", [])
    let editedPrompts = getObject("changedPrompts", [])
    for (let prompt of prompts) {
        if (prompt.folder === name) {
            editedPrompts = [...editedPrompts, prompt.id]
            prompt.lastChanged = getCurrentTimestamp()
            prompt.folder = ""
        }
    }
    setObject("changedPrompts", editedPrompts)
    return prompts
}

export function removeFolder(name: string): string[] {
    let folders: string[] = getObject("folders", [])
    let i = 0
    for (const folder of folders) {
        if (folder === name) {
            folders.splice(i, 1)
        }
        i += 1
    }
    return folders
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

export function replaceVariables(str: string, values: string[]): string {
    const variables = findVariables(str)
    variables.forEach((variable, index) => {
        let value = values[index % values.length]
        if (value === undefined) value = ""
        const regex = new RegExp(`{{${escapeRegExp(variable)}}}`, "g")
        str = str.replace(regex, value)
    })
    return str
}

export function copyTextToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
        function () {
            //console.log('Async: Copying to clipboard was successful!');
        },
        function (err) {
            console.error("Async: Could not copy text: ", err)
        },
    )
}

export function uuid(): string {
    return ("" + [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
    )
}
