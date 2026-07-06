import {
    $getNodeByKey,
    DecoratorNode,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from "lexical"
import { useEffect, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $createRawTokenNode } from "./RawTokenNode"
import VariablePill from "../VariablePill"

// A Lexical decorator node that renders a `{{…}}` variable token as an inline chip. Its text
// content is the exact raw token, so serializing the editor (root.getTextContent()) round-trips
// back to the plain-text prompt the store persists — the editor stays a view over a string.
//
// Live-preview (Obsidian-style): clicking a chip replaces it with a raw text node (its `{{…}}`
// source) and drops the caret into it, so you edit in place. The editor only chips text nodes the
// caret is *not* in (see $chipTransform in PromptEditor), so it re-renders as a pill the moment the
// caret leaves. We attach the click as a native listener because decorator DOM sits outside React's
// delegated event tree, so an `onMouseDown` prop never fires.
//
// A click also fires `EDIT_VARIABLE_EVENT` so PromptEditor can pop the visual builder pre-filled
// with this token; the event carries the raw source node's key so the builder can replace it.

export type SerializedVariableChipNode = Spread<{ token: string }, SerializedLexicalNode>

export const EDIT_VARIABLE_EVENT = "promptvar:edit"

export interface EditVariableDetail {
    token: string
}

function VariableChip({ token, nodeKey }: { token: string; nodeKey: NodeKey }) {
    const [editor] = useLexicalComposerContext()
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault()
            editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                if (!$isVariableChipNode(node)) return
                // A RawTokenNode (not plain text) so it stays isolated from neighbours: "caret in
                // the token" is then just "caret in this node".
                const raw = $createRawTokenNode(node.__token)
                node.replace(raw)
                raw.select(node.__token.length, node.__token.length) // caret at end of the source
            })
            // Also pop the visual builder pre-filled with this token (the builder finds the revealed
            // source node by the token text, so no fragile node key needs to travel with the event).
            const detail: EditVariableDetail = { token }
            window.dispatchEvent(new CustomEvent(EDIT_VARIABLE_EVENT, { detail }))
        }
        el.addEventListener("mousedown", onMouseDown)
        return () => el.removeEventListener("mousedown", onMouseDown)
    }, [editor, nodeKey])

    return (
        <VariablePill
            ref={ref}
            token={token}
            contentEditable={false}
            className="cursor-text transition-colors hover:border-accent/50 hover:bg-accent/20"
        />
    )
}

export class VariableChipNode extends DecoratorNode<JSX.Element> {
    __token: string

    static getType(): string {
        return "variable-chip"
    }

    static clone(node: VariableChipNode): VariableChipNode {
        return new VariableChipNode(node.__token, node.__key)
    }

    constructor(token: string, key?: NodeKey) {
        super(key)
        this.__token = token
    }

    createDOM(): HTMLElement {
        const span = document.createElement("span")
        span.style.display = "inline-block"
        return span
    }

    updateDOM(): boolean {
        return false
    }

    // Serialization hook: the chip contributes its raw token to root.getTextContent().
    getTextContent(): string {
        return this.__token
    }

    isInline(): boolean {
        return true
    }

    isKeyboardSelectable(): boolean {
        return true
    }

    static importJSON(serialized: SerializedVariableChipNode): VariableChipNode {
        return $createVariableChipNode(serialized.token)
    }

    exportJSON(): SerializedVariableChipNode {
        return { type: "variable-chip", version: 1, token: this.__token }
    }

    decorate(): JSX.Element {
        return <VariableChip token={this.__token} nodeKey={this.getKey()} />
    }
}

export function $createVariableChipNode(token: string): VariableChipNode {
    return new VariableChipNode(token)
}

export function $isVariableChipNode(
    node: LexicalNode | null | undefined,
): node is VariableChipNode {
    return node instanceof VariableChipNode
}
