import i18n from "i18next"
import k from "./../i18n/keys"
import { useEffect, useRef, useState } from "react"
import {
    $createLineBreakNode,
    $createParagraphNode,
    $createTextNode,
    $getNodeByKey,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    $setSelection,
    ElementNode,
    type BaseSelection,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
    TextNode,
} from "lexical"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
    $createVariableChipNode,
    EDIT_VARIABLE_EVENT,
    type EditVariableDetail,
    VariableChipNode,
} from "./editor/VariableChipNode"
import { $createRawTokenNode, $isRawTokenNode, RawTokenNode } from "./editor/RawTokenNode"
import InsertVariableMenu from "./InsertVariableMenu"

// Notion-style inline chip editor. It's a thin view over a plain string: variable tokens render as
// chips but serialize back to their exact `{{…}}` text, so the store still holds a string and every
// other consumer (parser, fill modal, sync) is unchanged.
//
// Simple/typed tokens ({{name}}, {{n::number-0}}, {{t::list-a; b}}) become chips. Conditionals —
// which contain inner braces — stay as editable raw text; they still work end-to-end.

// Matches a whole simple/typed token but not a conditional (conditionals contain `{`).
const CHIP_RE = /\{\{[^{}]+\}\}/g
// A full, single token — used to decide whether an edited raw source is still a valid variable.
const FULL_TOKEN_RE = /^\{\{[^{}]+\}\}$/

interface PromptEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

/** Append literal text, converting `\n` into Lexical line breaks (keeps a single paragraph). */
function appendTextWithBreaks(parent: ElementNode, text: string): void {
    const lines = text.split("\n")
    lines.forEach((line, i) => {
        if (i > 0) parent.append($createLineBreakNode())
        if (line.length > 0) parent.append($createTextNode(line))
    })
}

/** Build the initial editor state: literal text with chips pre-materialized for known tokens. */
function populate(value: string) {
    const root = $getRoot()
    if (root.getFirstChild() !== null) return
    const paragraph = $createParagraphNode()

    let last = 0
    for (const match of value.matchAll(CHIP_RE)) {
        const start = match.index ?? 0
        if (start > last) appendTextWithBreaks(paragraph, value.slice(last, start))
        paragraph.append($createVariableChipNode(match[0]))
        last = start + match[0].length
    }
    if (last < value.length) appendTextWithBreaks(paragraph, value.slice(last))
    root.append(paragraph)
}

/** Serialize the editor back to a plain prompt string (blocks joined by single newlines). */
function serialize(): string {
    return $getRoot()
        .getChildren()
        .map(child => child.getTextContent())
        .join("\n")
}

// Live transform: turn a complete `{{…}}` token into a chip — but never the text node the caret is
// currently in. That "skip the node under the caret" rule is what gives the Obsidian live-preview
// feel: the token you're editing shows its raw source, every other token renders as a pill.
function $chipTransform(node: TextNode): void {
    if (!node.isSimpleText()) return
    const sel = $getSelection()
    if (
        $isRangeSelection(sel) &&
        (sel.anchor.key === node.getKey() || sel.focus.key === node.getKey())
    ) {
        return // caret is in this node — leave the source visible for editing
    }
    const text = node.getTextContent()
    const match = CHIP_RE.exec(text)
    CHIP_RE.lastIndex = 0
    if (!match) return
    const start = match.index
    const end = start + match[0].length
    const parts = node.splitText(start, end)
    const target = start === 0 ? parts[0] : parts[1]
    target.replace($createVariableChipNode(match[0]))
}

function ChipPlugin() {
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
        // registerNodeTransform runs against future edits; initial tokens are handled by populate().
        return editor.registerNodeTransform(TextNode, $chipTransform)
    }, [editor])
    return null
}

// All RawTokenNodes currently in the document (usually zero or one).
function $collectRawTokens(): RawTokenNode[] {
    const out: RawTokenNode[] = []
    const walk = (node: LexicalNode) => {
        if ($isRawTokenNode(node)) out.push(node)
        else if (node instanceof ElementNode) node.getChildren().forEach(walk)
    }
    walk($getRoot())
    return out
}

// True when a collapsed caret is inside the raw token or sitting exactly on either edge of it. The
// edge cases matter: after reveal the caret lands at the token's trailing edge, which Lexical
// normalizes onto the *next* node — without this it would look like the caret already left.
function $caretTouchesRaw(anchor: { key: NodeKey; offset: number }, raw: RawTokenNode): boolean {
    if (anchor.key === raw.getKey()) return true
    const next = raw.getNextSibling()
    if (next && anchor.key === next.getKey() && anchor.offset === 0) return true
    const prev = raw.getPreviousSibling()
    if (prev && anchor.key === prev.getKey() && anchor.offset === prev.getTextContentSize()) {
        return true
    }
    return false
}

// Turn a raw source node back into a chip (or plain text if the user edited it into something that
// is no longer a valid `{{…}}`). `exceptKey` keeps the one the caret is currently inside.
function $commitRawTokens(exceptKey?: NodeKey | null): void {
    for (const raw of $collectRawTokens()) {
        if (raw.getKey() === exceptKey) continue
        const text = raw.getTextContent()
        raw.replace(
            FULL_TOKEN_RE.test(text) ? $createVariableChipNode(text) : $createTextNode(text),
        )
    }
}

// Typed-token re-chip: when the caret leaves a *plain* text node, re-run the transform on it so any
// `{{…}}` the user typed becomes a chip. (Revealed sources are RawTokenNodes, handled separately.)
function RevealPlugin() {
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
        let lastKey: NodeKey | null = null
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const sel = $getSelection()
                const cur = $isRangeSelection(sel) ? sel.anchor.key : null
                if (cur !== lastKey) {
                    const key = lastKey
                    lastKey = cur
                    if (key)
                        queueMicrotask(() => editor.update(() => $getNodeByKey(key)?.markDirty()))
                }
            })
        })
    }, [editor])
    return null
}

// Obsidian live-preview core: while the caret is inside a revealed token (a RawTokenNode) it stays
// editable source; the moment the caret sits elsewhere in the editor, that token snaps back to a
// chip. Blur (e.g. focusing the builder or clicking another field) leaves the source alone — those
// paths are handled by the builder, so you can edit a token's settings without it re-chipping.
function RawTokenPlugin() {
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
        return editor.registerUpdateListener(() => {
            let toCommit: NodeKey[] = []
            editor.getEditorState().read(() => {
                const raws = $collectRawTokens()
                if (raws.length === 0) return
                const sel = $getSelection()
                if (!$isRangeSelection(sel) || !sel.isCollapsed()) return // blur / range select → keep
                toCommit = raws
                    .filter(raw => !$caretTouchesRaw(sel.anchor, raw))
                    .map(r => r.getKey())
            })
            if (toCommit.length) {
                queueMicrotask(() =>
                    editor.update(() => {
                        for (const key of toCommit) {
                            const node = $getNodeByKey(key)
                            if (!$isRawTokenNode(node)) continue
                            const text = node.getTextContent()
                            node.replace(
                                FULL_TOKEN_RE.test(text)
                                    ? $createVariableChipNode(text)
                                    : $createTextNode(text),
                            )
                        }
                    }),
                )
            }
        })
    }, [editor])
    return null
}

// Hosts the visual builder for both "insert a new variable" (toolbar button) and "edit this one"
// (clicking a chip fires EDIT_VARIABLE_EVENT). In edit mode it replaces the exact revealed token.
type MenuMode = { kind: "closed" } | { kind: "insert" } | { kind: "edit"; token: string }

function VariableMenuHost() {
    const t = i18n.t
    const [editor] = useLexicalComposerContext()
    const [mode, setMode] = useState<MenuMode>({ kind: "closed" })
    // The caret at the moment the menu opened — restored on insert, since typing into the menu's
    // own inputs blurs the editor and clears its live selection.
    const savedSelection = useRef<BaseSelection | null>(null)

    // Open the builder pre-filled when a chip is clicked.
    useEffect(() => {
        const onEdit = (e: Event) => {
            const detail = (e as CustomEvent<EditVariableDetail>).detail
            setMode({ kind: "edit", token: detail.token })
        }
        window.addEventListener(EDIT_VARIABLE_EVENT, onEdit)
        return () => window.removeEventListener(EDIT_VARIABLE_EVENT, onEdit)
    }, [])

    // The builder is open exactly while a raw source exists. When the caret leaves the token (the
    // RawTokenPlugin re-chips it), close the builder too.
    useEffect(() => {
        if (mode.kind !== "edit") return
        return editor.registerUpdateListener(() => {
            let hasRaw = false
            editor.getEditorState().read(() => (hasRaw = $collectRawTokens().length > 0))
            if (!hasRaw) setMode({ kind: "closed" })
        })
    }, [editor, mode.kind])

    function closeMenu() {
        setMode({ kind: "closed" })
    }

    // Cancel from edit mode: commit the (possibly edited) raw source back to a chip.
    function cancelEdit() {
        editor.update(() => $commitRawTokens())
        setMode({ kind: "closed" })
    }

    function toggleInsert() {
        if (mode.kind !== "closed") {
            closeMenu()
            return
        }
        editor.getEditorState().read(() => {
            const sel = $getSelection()
            savedSelection.current = sel ? sel.clone() : null
        })
        setMode({ kind: "insert" })
    }

    function insertToken(token: string) {
        editor.update(() => {
            const saved = savedSelection.current
            if (saved && $isRangeSelection(saved)) {
                $setSelection(saved.clone())
            } else {
                $getRoot().selectEnd() // no prior caret: insert at the very end
            }
            const selection = $getSelection()
            if ($isRangeSelection(selection)) selection.insertText(token)
        })
        closeMenu()
    }

    function updateToken(newToken: string) {
        editor.update(() => {
            const [raw] = $collectRawTokens()
            if (raw) raw.replace($createVariableChipNode(newToken))
        })
        setMode({ kind: "closed" })
    }

    return (
        <div className="relative">
            <button
                type="button"
                className="btn btn-xs btn-outline mt-1"
                // Keep the editor's caret while opening the menu.
                onMouseDown={e => e.preventDefault()}
                onClick={toggleInsert}
            >
                + {t(k.INSERT_VARIABLE)}
            </button>
            {mode.kind === "insert" && (
                <InsertVariableMenu onInsert={insertToken} onClose={closeMenu} />
            )}
            {mode.kind === "edit" && (
                <InsertVariableMenu
                    initialToken={mode.token}
                    onInsert={updateToken}
                    onClose={cancelEdit}
                />
            )}
        </div>
    )
}

export default function PromptEditor({ value, onChange, placeholder }: PromptEditorProps) {
    const initialConfig = {
        namespace: "PromptEditor",
        nodes: [VariableChipNode, RawTokenNode],
        editorState: (_editor: LexicalEditor) => populate(value),
        onError: (error: Error) => console.error("PromptEditor", error),
        theme: {},
    }

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="textarea textarea-bordered w-full min-h-[100px] p-2">
                <PlainTextPlugin
                    contentEditable={
                        <ContentEditable className="outline-none min-h-[80px] whitespace-pre-wrap" />
                    }
                    placeholder={
                        <div className="pointer-events-none -mt-[80px] p-1 opacity-40">
                            {placeholder}
                        </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
            </div>
            <ChipPlugin />
            <RevealPlugin />
            <RawTokenPlugin />
            <OnChangePlugin
                onChange={editorState => editorState.read(() => onChange(serialize()))}
            />
            <VariableMenuHost />
        </LexicalComposer>
    )
}
