import i18n from "i18next"
import k from "./../i18n/keys"
import { useEffect, useMemo, useRef, useState } from "react"
import { useOptionSetStore } from "../store/useOptionSetStore"
import { parseVar } from "./js/variables"
import { type BuilderType, TYPE_INFO, TypeIcon } from "./editor/varTypeMeta"

// The "Insert Variable" builder. Pure UI: it assembles a canonical `{{…}}` token string and hands
// it to `onInsert`. It never touches the editor directly, so it's reusable from anywhere.

const BUILDER_TYPES: BuilderType[] = ["text", "largeText", "number", "dropdown", "conditional"]

interface Def {
    name: string
    type: "text" | "largeText" | "number" | "dropdown"
    defaultValue: string // optional default for text / largeText / number
    optionMode: "inline" | "saved"
    inlineOptions: string // one per line
    savedSet: string
}

const emptyDef = (): Def => ({
    name: "",
    type: "text",
    defaultValue: "",
    optionMode: "inline",
    inlineOptions: "",
    savedSet: "",
})

function inlineOptionsToList(raw: string): string[] {
    return raw
        .split("\n")
        .map(o => o.trim())
        .filter(o => o.length > 0)
}

/** Build the inner (brace-less) definition, e.g. `Name::number-0` or `Name::text-Hi`. */
function buildInner(def: Def): string {
    const name = def.name.trim() || "variable"
    const dflt = def.defaultValue.trim()
    switch (def.type) {
        case "text":
            return dflt ? `${name}::text-${dflt}` : `${name}::text`
        case "largeText":
            return dflt ? `${name}::largeText-${dflt}` : `${name}::largeText`
        case "number":
            return dflt ? `${name}::number-${dflt}` : `${name}::number`
        case "dropdown":
            return def.optionMode === "saved"
                ? `${name}::list@${def.savedSet.trim()}`
                : `${name}::list-${inlineOptionsToList(def.inlineOptions).join("; ")}`
    }
}

// Prefill the builder from an existing simple-variable token (chips are only ever simple vars —
// conditionals stay as raw text and never open this in edit mode).
function tokenToInitial(token?: string): { builderType: BuilderType; def: Def } {
    if (!token) return { builderType: "text", def: emptyDef() }
    const v = parseVar(token.slice(2, -2), token)
    const type = (v.type === "legacy" ? "text" : v.type) as Def["type"]
    return {
        builderType: type,
        def: {
            name: v.name,
            type,
            defaultValue: v.default ?? "",
            optionMode: v.optionSetRef ? "saved" : "inline",
            inlineOptions: (v.options ?? []).join("\n"),
            savedSet: v.optionSetRef ?? "",
        },
    }
}

interface InsertVariableMenuProps {
    onInsert: (token: string) => void
    onClose: () => void
    /** When set, the builder opens pre-filled to edit this token and the button reads "Update". */
    initialToken?: string
}

export default function InsertVariableMenu({
    onInsert,
    onClose,
    initialToken,
}: InsertVariableMenuProps) {
    const t = i18n.t
    const optionSets = useOptionSetStore(s => s.optionSets)
    const initial = useMemo(() => tokenToInitial(initialToken), [initialToken])
    const rootRef = useRef<HTMLDivElement>(null)

    // Dismiss when the user clicks fully away from the editing area. The listener is added on mount
    // — after the click that opened the builder — so it can't self-close. Clicks inside the builder
    // or inside the editor (editing the variable's source inline, or clicking another chip) are
    // exempt; only clicking somewhere else entirely (another field, the backdrop) closes it.
    //
    // Capture phase matters: clicking another chip reveals it, which synchronously replaces that
    // chip's DOM. By the bubbling phase the event target is detached and `closest` can't tell it was
    // in the editor — so we check during capture, before that mutation happens.
    useEffect(() => {
        const onPointerDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (rootRef.current?.contains(target)) return
            if (target.closest?.('[contenteditable="true"]')) return
            onClose()
        }
        document.addEventListener("mousedown", onPointerDown, true)
        return () => document.removeEventListener("mousedown", onPointerDown, true)
    }, [onClose])

    const [builderType, setBuilderType] = useState<BuilderType>(initial.builderType)
    const [main, setMain] = useState<Def>(initial.def)
    const [cond, setCond] = useState("")
    const [thenDef, setThenDef] = useState<Def>(emptyDef)
    const [elseEnabled, setElseEnabled] = useState(false)
    const [elseDef, setElseDef] = useState<Def>(emptyDef)

    function insert() {
        let token: string
        if (builderType === "conditional") {
            const elseClause = elseEnabled ? `;else {${buildInner(elseDef)}}` : ""
            token = `{{if ${cond.trim()} {${buildInner(thenDef)}}${elseClause}}}`
        } else {
            token = `{{${buildInner({ ...main, type: builderType })}}}`
        }
        onInsert(token)
        onClose()
    }

    return (
        <div
            ref={rootRef}
            className="absolute z-20 mt-2 w-80 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-2xl"
        >
            <div className="flex items-center justify-between border-b border-base-300 bg-base-200/50 px-3 py-2">
                <span className="text-sm font-semibold">
                    {initialToken ? t(k.EDIT_VARIABLE) : t(k.INSERT_VARIABLE)}
                </span>
                <button
                    className="btn btn-circle btn-ghost btn-xs"
                    onClick={onClose}
                    aria-label={t(k.CANCEL)}
                >
                    ✕
                </button>
            </div>

            <div className="p-3">
                <div className="mb-3">
                    <div className="mb-1.5 text-xs font-semibold opacity-60">
                        {t(k.VARIABLE_TYPE)}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {BUILDER_TYPES.map(bt => {
                            const active = builderType === bt
                            return (
                                <button
                                    key={bt}
                                    onClick={() => setBuilderType(bt)}
                                    className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs transition-colors ${
                                        active
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-base-300 hover:border-base-content/30 hover:bg-base-200"
                                    }`}
                                >
                                    <TypeIcon type={bt} className="h-4 w-4" />
                                    {TYPE_INFO[bt].label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {builderType === "conditional" ? (
                    <>
                        <LabeledInput
                            label={t(k.CONDITION)}
                            placeholder='e.g. role == "dev"'
                            value={cond}
                            onChange={setCond}
                        />
                        <div className="mt-2 rounded-lg border border-base-300 p-2">
                            <div className="mb-1 text-xs font-semibold opacity-60">
                                {t(k.THEN_INSERT)}
                            </div>
                            <DefFields def={thenDef} setDef={setThenDef} optionSets={optionSets} />
                        </div>
                        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={elseEnabled}
                                onChange={e => setElseEnabled(e.target.checked)}
                            />
                            {t(k.ELSE_INSERT)}
                        </label>
                        {elseEnabled && (
                            <div className="mt-2 rounded-lg border border-base-300 p-2">
                                <DefFields
                                    def={elseDef}
                                    setDef={setElseDef}
                                    optionSets={optionSets}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <DefFields
                        def={{ ...main, type: builderType }}
                        setDef={setMain}
                        optionSets={optionSets}
                    />
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        {t(k.CANCEL)}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={insert}>
                        {initialToken ? t(k.UPDATE) : t(k.INSERT)}
                    </button>
                </div>
            </div>
        </div>
    )
}

function LabeledInput({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string
    value: string
    placeholder?: string
    onChange: (v: string) => void
}) {
    return (
        <div className="mb-2">
            <div className="text-xs font-bold mb-1">{label}</div>
            <input
                className="input input-bordered input-sm w-full"
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}

// Shared name + type-specific fields. `def.type` is driven by the parent (the outer type
// selector), so this only shows the extra inputs a given type needs.
function DefFields({
    def,
    setDef,
    optionSets,
}: {
    def: Def
    setDef: (updater: (prev: Def) => Def) => void
    optionSets: { id: string; name: string }[]
}) {
    const t = i18n.t
    return (
        <div>
            <LabeledInput
                label={t(k.VARIABLE_NAME)}
                value={def.name}
                onChange={v => setDef(prev => ({ ...prev, name: v }))}
            />
            {(def.type === "text" || def.type === "largeText" || def.type === "number") && (
                <LabeledInput
                    label={t(k.DEFAULT_VALUE)}
                    value={def.defaultValue}
                    onChange={v => setDef(prev => ({ ...prev, defaultValue: v }))}
                />
            )}
            {def.type === "dropdown" && (
                <div className="mb-1">
                    <div className="flex gap-2 mb-1 text-sm">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                className="radio radio-sm"
                                checked={def.optionMode === "inline"}
                                onChange={() => setDef(prev => ({ ...prev, optionMode: "inline" }))}
                            />
                            {t(k.INLINE_OPTIONS)}
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                className="radio radio-sm"
                                checked={def.optionMode === "saved"}
                                onChange={() => setDef(prev => ({ ...prev, optionMode: "saved" }))}
                            />
                            {t(k.USE_SAVED_SET)}
                        </label>
                    </div>
                    {def.optionMode === "inline" ? (
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full"
                            rows={3}
                            placeholder={t(k.OPTION_SET_OPTIONS_PLACEHOLDER)}
                            value={def.inlineOptions}
                            onChange={e =>
                                setDef(prev => ({ ...prev, inlineOptions: e.target.value }))
                            }
                        />
                    ) : (
                        <select
                            className="select select-bordered select-sm w-full"
                            value={def.savedSet}
                            onChange={e => setDef(prev => ({ ...prev, savedSet: e.target.value }))}
                        >
                            <option value="">—</option>
                            {optionSets.map(s => (
                                <option key={s.id} value={s.name}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </div>
    )
}
