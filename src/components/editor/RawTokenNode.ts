import { $applyNodeReplacement, TextNode, type LexicalNode, type SerializedTextNode } from "lexical"

// The editable raw source of a variable while you're editing it in place (Obsidian live-preview).
// It's a TextNode subclass with its own type, so Lexical never merges it with the surrounding text
// — that keeps "the caret is inside this token" a simple node-identity check (no offset math), and
// the chip transform (registered for plain TextNode) never touches it. When the caret leaves, the
// editor converts it back to a chip. See PromptEditor's RawTokenPlugin.

export class RawTokenNode extends TextNode {
    static getType(): string {
        return "raw-token"
    }

    static clone(node: RawTokenNode): RawTokenNode {
        return new RawTokenNode(node.__text, node.__key)
    }

    static importJSON(serialized: SerializedTextNode): RawTokenNode {
        const node = $createRawTokenNode(serialized.text)
        node.setFormat(serialized.format)
        node.setDetail(serialized.detail)
        node.setMode(serialized.mode)
        node.setStyle(serialized.style)
        return node
    }

    exportJSON(): SerializedTextNode {
        return { ...super.exportJSON(), type: "raw-token", version: 1 }
    }
}

export function $createRawTokenNode(text: string): RawTokenNode {
    return $applyNodeReplacement(new RawTokenNode(text))
}

export function $isRawTokenNode(node: LexicalNode | null | undefined): node is RawTokenNode {
    return node instanceof RawTokenNode
}
