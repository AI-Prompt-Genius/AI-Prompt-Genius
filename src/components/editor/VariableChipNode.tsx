import {
    DecoratorNode,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from "lexical"
import { parseVar } from "../js/variables"
import { TYPE_INFO, TypeIcon, iconKeyFor } from "./varTypeMeta"

// A Lexical decorator node that renders a `{{…}}` variable token as an inline chip. Its text
// content is the exact raw token, so serializing the editor (root.getTextContent()) round-trips
// back to the plain-text prompt the store persists — the editor stays a view over a string.

export type SerializedVariableChipNode = Spread<{ token: string }, SerializedLexicalNode>

function VariableChip({ token }: { token: string }) {
    const v = parseVar(token.slice(2, -2), token)
    const typeLabel = TYPE_INFO[iconKeyFor(v.type)].label
    return (
        <span
            className="group mx-px inline-flex select-none items-center gap-1 rounded-full border border-accent/25 bg-accent/10 py-0.5 pl-1.5 pr-2 align-middle text-sm font-medium leading-5 text-accent shadow-sm transition-colors hover:border-accent/50 hover:bg-accent/20"
            contentEditable={false}
            title={`${v.name || "variable"} · ${typeLabel}`}
        >
            <TypeIcon type={v.type} className="h-3.5 w-3.5 opacity-70" />
            {v.name || "variable"}
        </span>
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
        return <VariableChip token={this.__token} />
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
