import i18n from "i18next"
import k from "./../i18n/keys"
import React, { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { deletePrompt, editPrompt, getCurrentTimestamp, promptLimitError, uuid } from "./js/utils"
import { DragHandleIcon, EditIcon, TrashIcon } from "./icons/Icons"
import FolderSelect from "./FolderSelect"
import PromptEditor from "./PromptEditor"
import RemoveTag from "./RemoveTag"
import Tag from "./Tag"
import { renderWithPills } from "./VariablePill"
import type { LegacyPrompt } from "../types"

interface TemplateProps {
    template: LegacyPrompt
    setPrompts: (...args: any[]) => void
    reorderPrompts: (draggedId: string, targetId: string, placeAfter?: boolean) => void
    onClick: () => void
    folders: string[]
    filterTags: string[]
    setFilterTags: (...args: any[]) => void
    filterPrompts: (folder?: string, tags?: string[], searchTerm?: string) => void
    selectedFolder: string
    searchTerm: string
    compact: boolean
    categories?: any
}

function Template({
    template,
    setPrompts,
    reorderPrompts,
    onClick,
    folders,
    filterTags,
    setFilterTags,
    filterPrompts,
    selectedFolder,
    searchTerm,
    compact,
}: TemplateProps) {
    const t = i18n.t

    const [editModalVisible, setEditModalVisible] = useState(false)
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [title, setTitle] = useState(template.title ?? "")
    const [text, setText] = useState(template.text ?? "")
    const [tags, setTags] = useState(template.tags ?? [])
    const [description, setDescription] = useState(template.description ?? "")
    const [folder, setFolder] = useState(template.folder ?? null)
    const [saveError, setSaveError] = useState<string | null>(null)

    const isFullScreen = new URLSearchParams(window.location.search).get("fullscreen") === "true"

    const tagRef = React.createRef<HTMLInputElement>()
    const cardRef = useRef<HTMLDivElement>(null)

    const compactBtnClass = compact ? "" : "max-[600px]:flex-col lg:flex-col"

    // Native HTML5 drag-and-drop reordering. The grip (left of the tags) is the only draggable
    // element; the whole card is the drop target. We drop *between* cards: the cursor's half of
    // the hovered card decides whether the item lands before or after it, and an insertion line is
    // shown in that gap. In a single-column layout the split is vertical (line above/below); in a
    // multi-column grid the cards sit side-by-side, so the split is horizontal (line left/right).
    // Reordering mutates the master prompt array via the store, and the filtered view re-derives
    // from it. The line and drop side are toggled directly on the DOM (not React state) so the
    // memoized card doesn't re-render mid-drag.

    // Which side the cursor is currently over (kept out of state to avoid re-renders). Read on drop.
    const dropAfterRef = useRef(false)

    type DropSide = "top" | "bottom" | "left" | "right" | "none"

    function setInsertionLine(side: DropSide) {
        const el = cardRef.current
        if (!el) return
        el.querySelector(".drop-line-top")?.classList.toggle("opacity-100", side === "top")
        el.querySelector(".drop-line-bottom")?.classList.toggle("opacity-100", side === "bottom")
        el.querySelector(".drop-line-left")?.classList.toggle("opacity-100", side === "left")
        el.querySelector(".drop-line-right")?.classList.toggle("opacity-100", side === "right")
    }

    // True when the card sits in a multi-column grid row (its parent grid has >1 column track).
    function isMultiColumn(): boolean {
        const parent = cardRef.current?.parentElement
        if (!parent) return false
        const cols = getComputedStyle(parent).gridTemplateColumns
        return cols !== "none" && cols.trim().split(/\s+/).length > 1
    }

    function handleDragStart(e: React.DragEvent) {
        e.dataTransfer.setData("text/plain", template.id)
        e.dataTransfer.effectAllowed = "move"
        // Drag the whole card, not just the little grip icon.
        if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 16, 16)
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        const rect = cardRef.current?.getBoundingClientRect()
        if (!rect) return
        if (isMultiColumn()) {
            const after = e.clientX > rect.left + rect.width / 2
            dropAfterRef.current = after
            setInsertionLine(after ? "right" : "left")
        } else {
            const after = e.clientY > rect.top + rect.height / 2
            dropAfterRef.current = after
            setInsertionLine(after ? "bottom" : "top")
        }
    }

    function handleDragLeave() {
        setInsertionLine("none")
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setInsertionLine("none")
        const draggedId = e.dataTransfer.getData("text/plain")
        if (draggedId && draggedId !== template.id)
            reorderPrompts(draggedId, template.id, dropAfterRef.current)
    }

    function showModal() {
        setEditModalVisible(true)
    }

    function closeModal() {
        ;(document.getElementById("prompt-modal") as HTMLInputElement).checked = false
        setTimeout(() => setEditModalVisible(false), 100) // to allow for cool animation
    }

    const handleSave = () => {
        const limitError = promptLimitError(text, template.id)
        if (limitError) {
            setSaveError(limitError)
            return
        }
        const editedPrompt = {
            title,
            text,
            tags,
            description,
            id: template.id ?? uuid(),
            lastChanged: getCurrentTimestamp(),
            folder: folder,
            sortIndex: template.sortIndex, // preserve manual order across edits
        }
        // Single source of truth: update the store; the filtered list re-derives automatically.
        setPrompts(editPrompt(template.id, editedPrompt))
        closeModal()
    }

    function confirmRemove(_id?: string) {
        setDeleteModalVisible(true)
        setTimeout(
            () =>
                ((
                    document.getElementById(
                        `delete_prompt_modal_${template.id}`,
                    ) as HTMLInputElement
                ).checked = true),
            300,
        )
    }

    function removePrompt(id: string) {
        setPrompts(deletePrompt(id))
    }

    function saveFolder(folder: string | null) {
        setFolder(folder)
    }

    function removeTag(tag: string) {
        setTags(prevTags => {
            const tagsSet = new Set(prevTags)
            tagsSet.delete(tag)
            return Array.from(tagsSet)
        })
    }

    function filterByTag(tag: string) {
        let newFiltered = new Set(filterTags)
        if (filterTags.includes(tag)) {
            newFiltered.delete(tag)
            setFilterTags(Array.from(newFiltered))
        } else {
            newFiltered.add(tag)
            setFilterTags(Array.from(newFiltered))
        }
        filterPrompts(selectedFolder, Array.from(newFiltered), searchTerm)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault() // Prevents the default behavior of the Enter key (e.g., form submission)
            const target = e.target as HTMLInputElement
            const newTag = target.value.trim()
            if (newTag) {
                setTags(prevTags => {
                    const tagsSet = new Set(prevTags) // Create a Set from the previous tags array
                    tagsSet.add(newTag) // Add the new tag to the Set
                    return Array.from(tagsSet) // Convert the Set back to an array
                })
                target.value = t(k._1) // Clear the input field
            }
        }
    }

    return (
        <>
            <div
                ref={cardRef}
                onClick={e => {
                    if ((e.target as HTMLElement).classList.contains("mainClick")) onClick()
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                id={template.id}
                className="mainClick relative z-0 card w-full lg:mb-0 bg-base-200/50 shadow-md template mb-3 cursor-pointer transition-colors hover:bg-base-300/50"
            >
                {/* Insertion indicators shown in the gap around the card while dragging over one of
                    its halves — top/bottom in a single column, left/right in a multi-column grid.
                    pointer-events-none so they never become the drag target. */}
                <span className="drop-line-top pointer-events-none absolute -top-1.5 left-2 right-2 h-1 rounded-full bg-primary opacity-0 transition-opacity" />
                <span className="drop-line-bottom pointer-events-none absolute -bottom-1.5 left-2 right-2 h-1 rounded-full bg-primary opacity-0 transition-opacity" />
                <span className="drop-line-left pointer-events-none absolute -left-1.5 top-2 bottom-2 w-1 rounded-full bg-primary opacity-0 transition-opacity" />
                <span className="drop-line-right pointer-events-none absolute -right-1.5 top-2 bottom-2 w-1 rounded-full bg-primary opacity-0 transition-opacity" />
                <div className="mainClick z-0 card-body flex flex-row p-4 justify-between align-top">
                    <div className="mainClick flex flex-col">
                        {template.title ? (
                            <h2 className="card-title mainClick flex">{template.title}</h2>
                        ) : (
                            <h2 className="card-title mainClick flex italic opacity-60">
                                {t(k.UNTITLED_PROMPT)}
                            </h2>
                        )}
                        {!compact && (
                            <p className="text-base mainClick mb-1">
                                {template.description && template.description !== ""
                                    ? template.description
                                    : renderWithPills(template.text ?? "")}
                            </p>
                        )}
                        <div className="flex items-center gap-1">
                            <div
                                draggable
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragLeave}
                                title={t(k.DRAG_TO_REORDER)}
                                className="drag-handle shrink-0 self-start mt-1 cursor-grab active:cursor-grabbing rounded p-0.5 opacity-40 hover:opacity-90 hover:bg-base-300"
                            >
                                <DragHandleIcon />
                            </div>
                            <div className={"flex flex-wrap"}>
                                {template.tags &&
                                    template.tags.map((tag, i) => (
                                        <Tag
                                            filterTags={filterTags}
                                            key={i}
                                            tag={tag}
                                            onClick={() => filterByTag(tag)}
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                    <div className={`mainClick buttons flex ${compactBtnClass}`}>
                        <button
                            onClick={showModal}
                            className="edit my-1 border-none btn p-1 bg-inherit"
                        >
                            <EditIcon></EditIcon>
                        </button>
                        <button
                            onClick={() => confirmRemove(template.id)}
                            className="my-1 border-none btn p-1 bg-inherit"
                        >
                            <TrashIcon></TrashIcon>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals are portaled to <body>: the cards live inside virtua's transformed row
                wrappers, and a transformed ancestor re-anchors position:fixed — without the
                portal the modal opens clipped inside the row and is effectively invisible. */}
            {editModalVisible &&
                createPortal(
                    <>
                        <input
                            defaultChecked
                            type="checkbox"
                            id="prompt-modal"
                            className="modal-toggle hidden"
                        />

                        <div className="modal">
                            <div
                                className={`modal-box ${
                                    isFullScreen ? "w-11/12 max-w-4xl" : "max-w-2xl"
                                }`}
                            >
                                <div>
                                    <div className="text-sm font-bold py-3">{t(k.TITLE)}</div>
                                    <input
                                        onChange={e => setTitle(e.target.value)}
                                        className="input input-bordered w-full"
                                        autoFocus
                                        defaultValue={template.title ?? ""}
                                        placeholder={t(k.NAME_FOR_YOUR_PROMPT)}
                                    />
                                    <div className="text-sm font-bold py-3">{t(k.TEXT)}</div>
                                    <PromptEditor
                                        value={text}
                                        onChange={v => {
                                            setText(v)
                                            if (saveError) setSaveError(null)
                                        }}
                                        placeholder={t(k.PROMPT_CONTENT_PLACEHOLDER)}
                                    />
                                    <div className="text-sm font-bold py-3">{t(k.DESCRIPTION)}</div>
                                    <textarea
                                        onChange={e => setDescription(e.target.value)}
                                        className="textarea textarea-bordered w-full h-[50px]"
                                        defaultValue={template.description ?? ""}
                                        placeholder={t(k.DESCRIPTION_PLACEHOLDER)}
                                    ></textarea>
                                    <div className="text-sm font-bold py-3">{t(k.TAGS)}</div>
                                    {/* eslint-disable-next-line react/prop-types */}
                                    <div className="flex flex-wrap mb-2">
                                        {template.tags &&
                                            // eslint-disable-next-line react/prop-types
                                            tags.map((tag, i) => (
                                                <RemoveTag
                                                    tag={tag}
                                                    key={i}
                                                    onClick={() => removeTag(tag)}
                                                ></RemoveTag>
                                            ))}
                                    </div>
                                    <input
                                        className="input input-bordered w-full h-[40px]"
                                        placeholder={t(k.ENTER_TAG)}
                                        ref={tagRef}
                                        onKeyDown={handleKeyDown}
                                    ></input>
                                    <div className="text-sm font-bold py-3">{t(k.FOLDER1)}</div>
                                    <div>
                                        <FolderSelect
                                            folders={folders}
                                            selectedFolder={folder}
                                            onChange={value => saveFolder(value)}
                                        />
                                    </div>
                                </div>
                                {saveError && (
                                    <div className="alert alert-error mt-3 py-2 text-sm">
                                        {saveError}
                                    </div>
                                )}
                                <div className="modal-action">
                                    <button className="btn" onClick={handleSave}>
                                        {t(k.SAVE)}
                                    </button>
                                </div>
                            </div>
                            <div className="modal-backdrop">
                                <button onClick={closeModal}>{t(k.CLOSE)}</button>
                            </div>
                        </div>
                    </>,
                    document.body,
                )}

            {deleteModalVisible &&
                createPortal(
                    <>
                        <input
                            type="checkbox"
                            id={`delete_prompt_modal_${template.id}`}
                            className="modal-toggle"
                            defaultChecked
                        />
                        <div className="modal" role="dialog">
                            <div className="modal-box">
                                <h3 className="font-bold text-lg">{t(k.CONFIRM_DELETE_PROMPT)}</h3>
                                <div className="modal-action">
                                    <label
                                        htmlFor={`delete_prompt_modal_${template.id}`}
                                        className="btn"
                                    >
                                        {t(k.CANCEL)}
                                    </label>
                                    <label
                                        htmlFor={`delete_prompt_modal_${template.id}`}
                                        className="btn btn-warning"
                                        onClick={() => removePrompt(template.id)}
                                    >
                                        {t(k.DELETE_PROMPT)}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body,
                )}
        </>
    )
}

// Memoized so unrelated store/filter changes don't re-render every visible card. Prompt object
// references are stable across filtering (filter doesn't clone), so unchanged cards skip re-render.
export default React.memo(Template)
