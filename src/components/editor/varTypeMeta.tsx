// Shared visual metadata for variable types — used by both the inline chips (VariableChipNode)
// and the insert-variable builder so a type looks the same everywhere.

export type BuilderType = "text" | "largeText" | "number" | "dropdown" | "conditional"

export const TYPE_INFO: Record<BuilderType, { label: string }> = {
    text: { label: "Text" },
    largeText: { label: "Large text" },
    number: { label: "Number" },
    dropdown: { label: "Dropdown" },
    conditional: { label: "If / else" },
}

/** Normalize a ParsedVar type (which includes "legacy") to a builder/icon key. */
export function iconKeyFor(type: string): BuilderType {
    return type === "legacy" ? "text" : (type as BuilderType)
}

export function TypeIcon({
    type,
    className = "w-3.5 h-3.5",
}: {
    type: string
    className?: string
}) {
    const key = iconKeyFor(type)
    const common = {
        className,
        viewBox: "0 0 16 16",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.6,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
    switch (key) {
        case "largeText":
            return (
                <svg {...common}>
                    <path d="M2.5 4h11M2.5 8h11M2.5 12h7" />
                </svg>
            )
        case "number":
            return (
                <svg {...common}>
                    <path d="M6 2.5 4.5 13.5M11.5 2.5 10 13.5M2.5 5.5h11M2 10.5h11" />
                </svg>
            )
        case "dropdown":
            return (
                <svg {...common}>
                    <rect x="2.5" y="3.5" width="11" height="9" rx="1.6" />
                    <path d="m6 7 2 2 2-2" />
                </svg>
            )
        case "conditional":
            return (
                <svg {...common}>
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" />
                    <circle cx="12" cy="8" r="1.5" />
                    <path d="M4 5.5v5M4 8h4.5a2 2 0 0 0 2-2" />
                </svg>
            )
        case "text":
        default:
            return (
                <svg {...common}>
                    <path d="M3 4.5V3.5h10v1M8 3.5v9M6 12.5h4" />
                </svg>
            )
    }
}
