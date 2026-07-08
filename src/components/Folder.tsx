import { useState } from "react"
import { useTranslation } from "react-i18next"
import k from "./../i18n/keys"
import { EditIcon, FolderIcon } from "./icons/Icons"

export default function Folder(props: {
    folder: string
    onClick: () => void
    onRename?: (oldName: string, newName: string) => void
    id?: string
}) {
    const { t } = useTranslation()
    let folder = props.folder
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(folder)

    function startEditing(e: React.MouseEvent) {
        e.stopPropagation()
        setValue(folder)
        setEditing(true)
    }

    function commit() {
        const next = value.trim()
        setEditing(false)
        if (next && next !== folder) {
            props.onRename?.(folder, next)
        } else {
            setValue(folder)
        }
    }

    return (
        <li className="folder" id={`folder-${folder}`} data-folder-name={folder}>
            {editing ? (
                <input
                    autoFocus
                    maxLength={18}
                    className="input input-bordered input-xs w-full"
                    value={value}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") commit()
                        if (e.key === "Escape") {
                            setValue(folder)
                            setEditing(false)
                        }
                    }}
                    onBlur={commit}
                />
            ) : (
                <a onClick={() => props.onClick()}>
                    <FolderIcon></FolderIcon>
                    <span className="grow truncate">{folder}</span>
                    {props.onRename && (
                        <button
                            type="button"
                            title={t(k.RENAME_FOLDER)}
                            aria-label={t(k.RENAME_FOLDER)}
                            className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                            onClick={startEditing}
                        >
                            <EditIcon></EditIcon>
                        </button>
                    )}
                </a>
            )}
        </li>
    )
}
