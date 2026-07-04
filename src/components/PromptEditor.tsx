import i18n from "i18next"
import k from "./../i18n/keys"
import { useEffect, useRef, useState } from "react"
import {
    $createLineBreakNode,
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    $setSelection,
    type BaseSelection,
    type ElementNode,
    type LexicalEditor,
    TextNode,
} from "lexical"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $createVariableChipNode, VariableChipNode } from "./editor/VariableChipNode"
import InsertVariableMenu from "./InsertVariableMenu"

// Notion-style inline chip editor. It's a thin view over a plain string: variable tokens render as
// chips but serialize back to their exact `{{…}}` text, so the store still holds a string and every
// other consumer (parser, fill modal, sync) is unchanged.
//
// Simple/typed tokens ({{name}}, {{n::number-0}}, {{t::list-a; b}}) become chips. Conditionals —
// which contain inner braces — stay as editable raw text; they still work end-to-end.

// Matches a whole simple/typed token but not a conditional (conditionals contain `{`).
const CHIP_RE = /\{\{[^{}]+\}\}/g

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

// Live transform: when the user types a complete `{{…}}` token, swap it for a chip.
function $chipTransform(node: TextNode): void {
    if (!node.isSimpleText()) return
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

function InsertToolbar() {
    const t = i18n.t
    const [editor] = useLexicalComposerContext()
    const [menuOpen, setMenuOpen] = useState(false)
    // The caret at the moment the menu opened — restored on insert, since typing into the menu's
    // own inputs blurs the editor and clears its live selection.
    const savedSelection = useRef<BaseSelection | null>(null)

    function toggleMenu() {
        editor.getEditorState().read(() => {
            const sel = $getSelection()
            savedSelection.current = sel ? sel.clone() : null
        })
        setMenuOpen(o => !o)
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
    }

    return (
        <div className="relative">
            <button
                type="button"
                className="btn btn-xs btn-outline mt-1"
                // Keep the editor's caret while opening the menu.
                onMouseDown={e => e.preventDefault()}
                onClick={toggleMenu}
            >
                + {t(k.INSERT_VARIABLE)}
            </button>
            {menuOpen && (
                <InsertVariableMenu onInsert={insertToken} onClose={() => setMenuOpen(false)} />
            )}
        </div>
    )
}

export default function PromptEditor({ value, onChange, placeholder }: PromptEditorProps) {
    const initialConfig = {
        namespace: "PromptEditor",
        nodes: [VariableChipNode],
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
            <OnChangePlugin
                onChange={editorState => editorState.read(() => onChange(serialize()))}
            />
            <InsertToolbar />
        </LexicalComposer>
    )
}
