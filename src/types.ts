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
    [key: string]: unknown
}

export type Theme = string

export interface ThemeContextValue {
    theme: Theme
    switchTheme: (newTheme: Theme) => void
}
