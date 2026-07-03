import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { VList } from "virtua"
import type { LegacyPrompt } from "../types"

// Column count mirrors the old Tailwind grid (flex → lg:grid-cols-2 → xl:grid-cols-3), but keyed
// off the container width (side panel vs. fullscreen) rather than the viewport.
function columnsForWidth(width: number): number {
    if (width >= 1280) return 3
    if (width >= 1024) return 2
    return 1
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

interface PromptGridProps {
    prompts: LegacyPrompt[]
    renderTemplate: (prompt: LegacyPrompt) => ReactNode
    header?: ReactNode
}

// Virtualized prompt grid: only the rows near the viewport are mounted, so a library of hundreds
// of prompts renders a constant number of cards. Rows are their own CSS grids to preserve the
// responsive multi-column layout; VList measures their (variable) heights.
export default function PromptGrid({ prompts, renderTemplate, header }: PromptGridProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [cols, setCols] = useState(1)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () => setCols(columnsForWidth(el.clientWidth))
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const rows = useMemo(() => chunk(prompts, cols), [prompts, cols])

    return (
        <div ref={containerRef} className="h-full">
            <VList style={{ height: "100%" }} className="px-4 max-[500px]:px-2 max-[500px]:mb-28">
                {header ? <div key="header">{header}</div> : null}
                {rows.map((row, i) => (
                    <div
                        key={row[0]?.id ?? i}
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            gap: "0.75rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        {row.map(renderTemplate)}
                    </div>
                ))}
            </VList>
        </div>
    )
}
