import { forwardRef } from "react"
import i18n from "i18next"
import k from "./../i18n/keys"
import { parseVar } from "./js/variables"
import { TypeIcon, iconKeyFor, typeLabel } from "./editor/varTypeMeta"

// The visual pill for a `{{…}}` variable token, shared by the inline chip editor (interactive) and
// the read-only prompt-card preview (see renderWithPills). Keeping it here means both render
// identically.

// Base look; callers add interaction affordances (editor) or `pointer-events-none` (preview).
const PILL_BASE_CLASS =
    "inline-flex select-none items-center gap-1 rounded-full border border-accent/25 bg-accent/10 py-0.5 pl-1.5 pr-2 align-middle text-sm font-medium leading-5 text-accent shadow-sm"

interface VariablePillProps extends React.HTMLAttributes<HTMLSpanElement> {
    token: string
}

const VariablePill = forwardRef<HTMLSpanElement, VariablePillProps>(
    ({ token, className = "", ...rest }, ref) => {
        const v = parseVar(token.slice(2, -2), token)
        const label = typeLabel(iconKeyFor(v.type))
        const fallbackName = i18n.t(k.VARIABLE_FALLBACK)
        return (
            <span
                ref={ref}
                className={`${PILL_BASE_CLASS} mx-px ${className}`}
                title={`${v.name || fallbackName} · ${label}`}
                {...rest}
            >
                <TypeIcon type={v.type} className="h-3.5 w-3.5 opacity-70" />
                {v.name || fallbackName}
            </span>
        )
    },
)
VariablePill.displayName = "VariablePill"

export default VariablePill

// Matches a whole simple/typed token (not a conditional, which contains inner braces).
const PREVIEW_TOKEN_RE = /\{\{[^{}]+\}\}/g

/** Render a prompt string as text with its variables shown as (non-interactive) pills. */
export function renderWithPills(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = []
    let last = 0
    let key = 0
    for (const match of text.matchAll(PREVIEW_TOKEN_RE)) {
        const start = match.index ?? 0
        if (start > last) nodes.push(text.slice(last, start))
        // pointer-events-none so a click still falls through to the card's own click handler.
        nodes.push(<VariablePill key={key++} token={match[0]} className="pointer-events-none" />)
        last = start + match[0].length
    }
    if (last < text.length) nodes.push(text.slice(last))
    return nodes
}
