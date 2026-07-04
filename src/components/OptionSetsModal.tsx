import i18n from "i18next"
import k from "./../i18n/keys"
import { useEffect, useState } from "react"
import { useOptionSetStore } from "../store/useOptionSetStore"
import { TrashIcon } from "./icons/Icons"

// Manage the global library of reusable dropdown option-sets. Opened via a window event so any
// component (Settings, the insert-variable builder) can launch it without prop drilling.

export const OPEN_OPTION_SETS_EVENT = "open-option-sets-modal"

export default function OptionSetsModal() {
    const t = i18n.t
    const [open, setOpen] = useState(false)
    const optionSets = useOptionSetStore(s => s.optionSets)
    const upsertByName = useOptionSetStore(s => s.upsertByName)
    const updateSet = useOptionSetStore(s => s.updateSet)
    const removeSet = useOptionSetStore(s => s.removeSet)

    const [newName, setNewName] = useState("")
    const [newOptions, setNewOptions] = useState("")

    useEffect(() => {
        const openHandler = () => setOpen(true)
        window.addEventListener(OPEN_OPTION_SETS_EVENT, openHandler)
        return () => window.removeEventListener(OPEN_OPTION_SETS_EVENT, openHandler)
    }, [])

    if (!open) return null

    // Options are entered one-per-line (commas are valid inside an option, so lines beat commas).
    function parseOptions(raw: string): string[] {
        return raw
            .split("\n")
            .map(o => o.trim())
            .filter(o => o.length > 0)
    }

    function createSet() {
        const options = parseOptions(newOptions)
        if (!newName.trim() || options.length === 0) return
        upsertByName(newName, options)
        setNewName("")
        setNewOptions("")
    }

    return (
        <>
            <input defaultChecked type="checkbox" className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box max-w-2xl">
                    <h3 className="font-bold text-lg mb-1">{t(k.OPTION_SETS)}</h3>
                    <p className="text-sm opacity-70 mb-4">{t(k.OPTION_SETS_DESCRIPTION)}</p>

                    {optionSets.length === 0 && (
                        <p className="italic opacity-60 mb-4">{t(k.NO_OPTION_SETS_YET)}</p>
                    )}

                    {optionSets.map(set => (
                        <div key={set.id} className="border border-base-300 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    className="input input-bordered input-sm flex-1"
                                    defaultValue={set.name}
                                    onBlur={e =>
                                        e.target.value.trim() &&
                                        updateSet(set.id, e.target.value, set.options)
                                    }
                                />
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => removeSet(set.id)}
                                    aria-label={t(k.DELETE)}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                            <textarea
                                className="textarea textarea-bordered w-full text-sm"
                                rows={Math.max(2, set.options.length)}
                                defaultValue={set.options.join("\n")}
                                onBlur={e =>
                                    updateSet(set.id, set.name, parseOptions(e.target.value))
                                }
                            />
                        </div>
                    ))}

                    <div className="border-t border-base-300 pt-3 mt-2">
                        <h4 className="font-semibold mb-2">{t(k.NEW_OPTION_SET)}</h4>
                        <input
                            className="input input-bordered w-full mb-2"
                            placeholder={t(k.OPTION_SET_NAME)}
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <textarea
                            className="textarea textarea-bordered w-full mb-2"
                            rows={3}
                            placeholder={t(k.OPTION_SET_OPTIONS_PLACEHOLDER)}
                            value={newOptions}
                            onChange={e => setNewOptions(e.target.value)}
                        />
                        <button className="btn btn-sm" onClick={createSet}>
                            {t(k.ADD)}
                        </button>
                    </div>

                    <div className="modal-action">
                        <button className="btn" onClick={() => setOpen(false)}>
                            {t(k.CLOSE)}
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop">
                    <button onClick={() => setOpen(false)}>{t(k.CLOSE)}</button>
                </div>
            </div>
        </>
    )
}
