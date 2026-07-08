// Central data model for AI Prompt Genius.
//
// The `Prompt`/`Folder` shapes below are the *target* model that Phase B (IndexedDB
// migration) normalizes every record into. Records currently persisted in localStorage
// only carry a subset of these fields, so reads that touch legacy data are typed as
// `LegacyPrompt` until the migration backfills ids / timestamps / folderId.

export interface Prompt {
    id: string
    title: string
    text: string
    description: string
    tags: string[]
    folderId: string | null
    sortIndex: number
    createdAt: number
    updatedAt: number
    deletedAt: number | null
}

export interface Folder {
    id: string
    name: string
    parentId: string | null
    color?: string
    sortIndex: number
    createdAt: number
    updatedAt: number
    deletedAt: number | null
}

// Shape of records as they exist in localStorage today (pre-Phase B). `folder` is a bare
// string name and most bookkeeping fields are optional. Normalized away by the migration.
export interface LegacyPrompt {
    id: string
    title?: string
    text?: string
    description?: string
    tags: string[]
    folder?: string | null
    lastChanged?: number
    // Position key for manual ordering (lower = earlier). Synced cross-device via `sort_index`.
    // Legacy records lack it; the store backfills from array order on load.
    sortIndex?: number
    [key: string]: unknown
}

// --- Typed variables (complex variable feature) ---------------------------------
// The prompt `text` string remains the single source of truth; these shapes are what
// `variables.ts` parses tokens *into* at fill time. Nothing here is persisted on a Prompt.

export type VarType = "legacy" | "text" | "largeText" | "number" | "dropdown"

export interface ParsedVar {
    name: string
    type: VarType
    default?: string // literal or expression, resolved by the mini-evaluator
    options?: string[] // inline dropdown options ({{n::list-a; b; c}})
    optionSetRef?: string // saved-set name ({{n::list@setName}})
    raw: string // exact source token incl. braces, used for substitution
}

// A conditional branch body: the literal text inside the branch braces plus the
// tokens ({vardef} groups, possibly nested conditionals) found within it.
export interface Branch {
    raw: string // body text inside the branch's { }, used for substitution
    tokens: Token[]
}

export interface Conditional {
    kind: "conditional"
    expr: string
    then: Branch
    else: Branch | null // null when there is no else clause
    raw: string // exact source token incl. {{ }}
}

export type Token = ParsedVar | Conditional

// A globally-saved, reusable dropdown option list, synced app-wide like prompts.
export interface OptionSet {
    id: string
    name: string
    options: string[]
    createdAt: number
    updatedAt: number
    deletedAt: number | null
}

export type Theme = string

export interface ThemeContextValue {
    theme: Theme
    switchTheme: (newTheme: Theme) => void
}
