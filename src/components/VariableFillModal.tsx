import i18n from "i18next"
import k from "./../i18n/keys"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ParsedVar } from "../types"
import { resolveActiveVars, resolveDefault, resolveText, tokenize } from "./js/variables"
import { optionsForSet, useOptionSetStore } from "../store/useOptionSetStore"

// Typed fill-in form. Replaces the old positional textarea list in MainContent: values are keyed
// by variable name (Record), which is what makes same-name reuse, conditionals, and dynamic
// fields work. Conditional branches re-evaluate on every keystroke so dependent fields appear
// and disappear live.

const PERSIST_KEY = "persisted_var_values"

interface VariableFillModalProps {
    promptText: string
    onClose: () => void
    /** Called with the fully-resolved prompt text when the user copies. */
    onSubmit: (resolvedText: string) => void
}

function loadPersisted(): Record<string, string> {
    if (localStorage.getItem("persist_variables") !== "true") return {}
    try {
        return JSON.parse(localStorage.getItem(PERSIST_KEY) ?? "{}")
    } catch {
        return {}
    }
}

export default function VariableFillModal({
    promptText,
    onClose,
    onSubmit,
}: VariableFillModalProps) {
    const t = i18n.t
    const optionSets = useOptionSetStore(s => s.optionSets)

    const tokens = useMemo(() => tokenize(promptText), [promptText])
    const [values, setValues] = useState<Record<string, string>>(() => loadPersisted())
    const modalRef = useRef<HTMLDivElement>(null)

    // The set of fields to show right now depends on current values (conditionals).
    const activeVars = useMemo(() => resolveActiveVars(tokens, values), [tokens, values])

    function setValue(name: string, value: string) {
        setValues(prev => ({ ...prev, [name]: value }))
    }

    function submit() {
        const resolved = resolveText(promptText, values, optionSets)
        if (localStorage.getItem("persist_variables") === "true") {
            localStorage.setItem(PERSIST_KEY, JSON.stringify(values))
        }
        onSubmit(resolved)
        onClose()
    }

    // Enter (without Shift, so multiline fields can still add newlines) copies.
    useEffect(() => {
        const el = modalRef.current
        if (!el) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
            }
        }
        el.addEventListener("keydown", onKeyDown)
        return () => el.removeEventListener("keydown", onKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, promptText, optionSets])

    return (
        <>
            <input defaultChecked type="checkbox" id="var_modal" className="modal-toggle hidden" />
            <div className="modal" ref={modalRef}>
                <div className="modal-box">
                    {activeVars.map((v, index) => (
                        <VariableField
                            key={v.name}
                            variable={v}
                            autoFocus={index === 0}
                            value={values[v.name] ?? ""}
                            placeholder={resolveDefault(v, values)}
                            optionsFor={ref => optionsForSet(optionSets, ref)}
                            onChange={val => setValue(v.name, val)}
                        />
                    ))}

                    <div className="modal-action">
                        {localStorage.getItem("persist_variables") === "true" && (
                            <button className="btn" onClick={() => setValues({})}>
                                Clear
                            </button>
                        )}
                        <button onClick={submit} id="save-vars" className="btn">
                            {t(k.COPY)}
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop">
                    <button onClick={onClose}>{t(k.CLOSE)}</button>
                </div>
            </div>
        </>
    )
}

interface VariableFieldProps {
    variable: ParsedVar
    value: string
    placeholder: string
    autoFocus: boolean
    optionsFor: (setRef: string) => string[]
    onChange: (value: string) => void
}

function VariableField({
    variable,
    value,
    placeholder,
    autoFocus,
    optionsFor,
    onChange,
}: VariableFieldProps) {
    const t = i18n.t
    const label = <div className="text-sm font-bold py-3">{variable.name}</div>

    switch (variable.type) {
        case "number":
            return (
                <div>
                    {label}
                    <input
                        type="number"
                        autoFocus={autoFocus}
                        className="input input-bordered w-full"
                        placeholder={placeholder || "0"}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            )
        case "dropdown": {
            const options = variable.optionSetRef
                ? optionsFor(variable.optionSetRef)
                : variable.options ?? []
            return (
                <div>
                    {label}
                    <select
                        autoFocus={autoFocus}
                        className="select select-bordered w-full"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    >
                        <option value="">{`${t(k.ENTER_VALUE_FOR)} ${variable.name}`}</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            )
        }
        case "text":
            return (
                <div>
                    {label}
                    <input
                        autoFocus={autoFocus}
                        className="input input-bordered w-full"
                        placeholder={placeholder || `${t(k.ENTER_VALUE_FOR)} ${variable.name}`}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            )
        // largeText and legacy both render a textarea (legacy preserves today's behavior).
        default:
            return (
                <div>
                    {label}
                    <textarea
                        autoFocus={autoFocus}
                        className="textarea textarea-bordered w-full"
                        placeholder={placeholder || `${t(k.ENTER_VALUE_FOR)} ${variable.name}`}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            )
    }
}
