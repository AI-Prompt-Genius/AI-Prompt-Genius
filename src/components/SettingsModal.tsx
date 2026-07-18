import i18n from "i18next"
import k from "./../i18n/keys"
import { useTranslation } from "react-i18next"
import React, { useState } from "react"
import {
    exportCsv,
    exportJson,
    downloadCSVTemplate,
    csvToJson,
    combineJSONArrays,
    removeDuplicatesByName,
} from "./js/export"
import {
    checkProperties,
    getObject,
    removeFolder,
    removeFolderFromPrompts,
    sendMessageToParent,
    setObject,
} from "./js/utils"
import LanguageSelect from "./LanguageSelect"
import { CrownIcon, EditIcon, TrashIcon } from "./icons/Icons"
import ShortcutInfo from "./ShortcutInfo"
import { ActivatePro } from "./ActivatePro"
import { ProFeatures } from "./ProFeatures"
import Head2 from "./Head2"
import Head4 from "./Head4"
import { getProStatus } from "./js/pro"
import { usePromptStore } from "../store/usePromptStore"
import { OPEN_OPTION_SETS_EVENT } from "./OptionSetsModal"

interface SettingsModalProps {
    setSettingsVisible: (...args: any[]) => void
    setSelectedFolder: (...args: any[]) => void
    setFilterTags: (...args: any[]) => void
    setSearchTerm: (...args: any[]) => void
    folders: string[]
    setFolders: (...args: any[]) => void
    showToast: (message: string) => void
    setPrompts: (...args: any[]) => void
    filterPrompts: (folder?: string, tags?: string[], searchTerm?: string) => void
}

export default function SettingsModal({
    setSettingsVisible,
    setSelectedFolder,
    setFilterTags,
    setSearchTerm,
    folders,
    setFolders,
    showToast,
    setPrompts,
    filterPrompts,
}: SettingsModalProps) {
    const { t, i18n } = useTranslation()

    const [currentPage, setCurrentPage] = useState("General")
    const [confirmDelete, setConfirmDelete] = useState(false)

    const isPro = getProStatus()

    const handlePageChange = (page: string) => {
        setCurrentPage(page)
    }

    function showConfirm() {
        setConfirmDelete(true)
    }

    function downloadTemplate() {
        downloadCSVTemplate()
    }

    function clearFilters() {
        setSelectedFolder("")
        setFilterTags([])
        setSearchTerm("")
    }

    function importAny() {
        let input = document.querySelector("#import") as HTMLInputElement | null
        let file = input?.files?.[0]
        if (!file) {
            console.warn(`unable to find a valid file`)
            showToast(t(k.FILE_NOT_FOUND)) // Modified to use i18n key
            return
        }

        let reader = new FileReader()
        reader.onload = function (event) {
            const string = (event.target?.result as string) ?? ""
            const convertedJson = csvToJson(string)
            let newPrompts = convertedJson.result
            let newFolders = convertedJson.folders

            if (
                !checkProperties(newPrompts[0], [
                    "title",
                    "text",
                    "description",
                    "folder",
                    "tags",
                    "id",
                ])
            ) {
                showToast(t(k.INVALID_CSV_TEMPLATE)) // Modified to use i18n key
                return
            }
            let oldFolders = getObject("folders", [])
            newFolders = removeDuplicatesByName(oldFolders, newFolders)

            const combinedFolders = combineJSONArrays(newFolders, oldFolders)
            setFolders(combinedFolders)

            let currentPrompts = getObject("prompts", [])
            currentPrompts = removeDuplicatesByName(newPrompts, currentPrompts)
            const combinedPrompts = combineJSONArrays(newPrompts, currentPrompts)

            let newPromptIds = getObject(newPrompts as any, [])
            for (const prompt of newPrompts) {
                newPromptIds.push(prompt.id)
            }
            setObject("newPrompts", newPromptIds)

            setPrompts(combinedPrompts)
            clearFilters()
            showToast(t(k.SUCCESSFULLY_IMPORTED_PROMPTS)) // Modified to use i18n key
            ;(document.querySelector("#close_modal") as HTMLElement).click()
        }
        reader.onerror = function (event) {
            console.error(`Error occurred in file reader: `)
            console.error(event)
            showToast(t(k.INVALID_FILE)) // Modified to use i18n key
        }
        reader.readAsText(file)
    }

    function openFileSelect() {
        ;(document.getElementById("import") as HTMLElement).click()
    }

    function deletePrompts() {
        // Mass delete: store clears prompts/folders, records tombstones, and wipes IndexedDB.
        usePromptStore.getState().clearAll()
        clearFilters()
        setConfirmDelete(false)
        showToast(t(k.DELETED_ALL_PROMPTS_AND_FOLDERS)) // Modified to use i18n key
        location.reload()
    }

    function closeModal() {
        ;(document.getElementById("settings-modal") as HTMLInputElement).checked = false
        setTimeout(() => setSettingsVisible(false), 100) // to allow for cool animation
    }

    function deleteFolder(name: string) {
        setFolders(removeFolder(name))
        setPrompts(removeFolderFromPrompts(name))
    }

    function renameFolderHandler(oldName: string) {
        const input = document.getElementById(`rename-input-${oldName}`) as HTMLInputElement | null
        const newName = input?.value.trim() ?? ""
        if (!newName || newName === oldName) return
        usePromptStore.getState().renameFolder(oldName, newName)
        // The old name may be the active filter — reset so the list doesn't go blank.
        clearFilters()
        showToast(newName)
    }

    function updatePersist() {
        const checked = (document.getElementById("persist-toggle") as HTMLInputElement).checked
        localStorage.setItem("persist_variables", String(checked))
    }

    function updateOpenInSidebar() {
        const checked = (document.getElementById("open-in-sidebar-toggle") as HTMLInputElement)
            .checked
        localStorage.setItem("open_in_sidebar", String(checked))
        sendMessageToParent({
            message: "set_toolbar_target",
            target: checked ? "sidebar" : "popup",
        })
    }

    return (
        <>
            <input
                defaultChecked
                type="checkbox"
                id="settings-modal"
                className="modal-toggle hidden"
            />

            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                    <div className="flex flex-col">
                        <div className="flex-grow overflow-hidden">
                            <ul className="tabs tabs-lifted w-full flex justify-between">
                                <a
                                    onClick={() => handlePageChange("General")}
                                    className={`p-1 grow tab ${
                                        currentPage === "General" ? "tab-active" : ""
                                    }`}
                                >
                                    <div className={"pb-3"}>{t(k.GENERAL_SETTINGS)}</div>
                                </a>
                                <a
                                    onClick={() => handlePageChange("Folders")}
                                    className={`p-1 grow tab ${
                                        currentPage === "Folders" ? "tab-active" : ""
                                    }`}
                                >
                                    {t(k.MANAGE_FOLDERS)}
                                </a>
                                <a
                                    onClick={() => handlePageChange("Export")}
                                    className={`p-1 grow tab ${
                                        currentPage === "Export" ? "tab-active" : ""
                                    }`}
                                >
                                    {t(k.IMPORT_EXPORT)}
                                </a>
                            </ul>
                        </div>

                        {currentPage === "General" && (
                            <div className="card mt-3 mb-3">
                                <div className="card-body pt-2">
                                    <h5 className="card-title">{t(k.LANGUAGE)}</h5>
                                    <LanguageSelect />
                                    <div className={"mt-3"}>
                                        {!isPro && (
                                            <div>
                                                <div className={"flex items-center"}>
                                                    <h2 className={"text-xl font-semibold"}>
                                                        {t(k.UPGRADE_TO_PRO)} &nbsp;
                                                    </h2>
                                                    <CrownIcon />
                                                </div>
                                                <Head4>{t(k.FEATURES)}</Head4>
                                                <ul className={"list-disc ml-6"}>
                                                    <li>{t(k.NO_ADS)}</li>
                                                    <li>{t(k.ACCESS_TO_NEW_THEMES)}</li>
                                                    <li>{t(k.SUPPORT_A_SMALL_DEVELOPER)}</li>
                                                </ul>
                                                <a
                                                    href={
                                                        "https://link.aipromptgenius.app/upgrade-pro"
                                                    }
                                                    target={"_blank"}
                                                    className={"btn btn-outline my-3"}
                                                >
                                                    {t(k.BUY_A_PRO_LICENSE)}
                                                </a>
                                            </div>
                                        )}
                                        <div className={"mt-3"}>
                                            <ActivatePro in_settings={true} showToast={showToast} />
                                        </div>
                                        <div className={"mb-2"}>
                                            <h2 className={"text-xl font-semibold my-3"}>
                                                {t(k.OTHER_SETTINGS)}
                                            </h2>
                                            <div className={"flex items-center"}>
                                                <h4 className={"text-lg font-medium"}>
                                                    {t(k.PERSIST_VARIABLES)}
                                                </h4>{" "}
                                                &nbsp;
                                                <input
                                                    id={"persist-toggle"}
                                                    type="checkbox"
                                                    className="toggle"
                                                    defaultChecked={
                                                        localStorage.getItem(
                                                            "persist_variables",
                                                        ) === "true"
                                                    }
                                                    onChange={() => updatePersist()}
                                                />
                                            </div>
                                            <p>{t(k.PERSIST_VARIABLES_DESCRIPTION)}</p>
                                        </div>
                                        <div className={"mb-2"}>
                                            <div className={"flex items-center"}>
                                                <h4 className={"text-lg font-medium"}>
                                                    {t(k.OPEN_IN_SIDEBAR)}
                                                </h4>{" "}
                                                &nbsp;
                                                <input
                                                    id={"open-in-sidebar-toggle"}
                                                    type="checkbox"
                                                    className="toggle"
                                                    defaultChecked={
                                                        localStorage.getItem(
                                                            "open_in_sidebar",
                                                        ) === "true"
                                                    }
                                                    onChange={() => updateOpenInSidebar()}
                                                />
                                            </div>
                                            <p>{t(k.OPEN_IN_SIDEBAR_DESCRIPTION)}</p>
                                        </div>
                                        <div className={"mb-3"}>
                                            <h4 className={"text-lg font-medium mb-1"}>
                                                {t(k.OPTION_SETS)}
                                            </h4>
                                            <p className={"mb-2"}>{t(k.OPTION_SETS_DESCRIPTION)}</p>
                                            <button
                                                className={"btn btn-outline btn-sm"}
                                                onClick={() =>
                                                    window.dispatchEvent(
                                                        new Event(OPEN_OPTION_SETS_EVENT),
                                                    )
                                                }
                                            >
                                                {t(k.MANAGE_OPTION_SETS)}
                                            </button>
                                        </div>
                                        <ShortcutInfo />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentPage === "Folders" && folders.length > 0 && (
                            <div className="card mt-3 mb-3">
                                <div className="card-body pt-2">
                                    <h5 className="card-title">{t(k.MANAGE_FOLDERS)}</h5>
                                    <table className="table w-full">
                                        <tbody>
                                            <tr className="justify-between">
                                                <th>{t(k.FOLDER_NAME)}</th>
                                                <th className="w-16 text-center">
                                                    <div className="my-1 disabled hover:bg-none border-none px-3 bg-inherit">
                                                        <TrashIcon />
                                                    </div>
                                                </th>
                                            </tr>
                                            {folders.map(folder => (
                                                <tr key={folder}>
                                                    <td>
                                                        <div className="join w-full">
                                                            <input
                                                                id={`rename-input-${folder}`}
                                                                defaultValue={folder}
                                                                maxLength={18}
                                                                className="input input-bordered input-sm join-item w-full"
                                                                onKeyDown={e => {
                                                                    if (e.key === "Enter")
                                                                        renameFolderHandler(folder)
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() =>
                                                                    renameFolderHandler(folder)
                                                                }
                                                                title={t(k.SAVE)}
                                                                aria-label={t(k.SAVE)}
                                                                className="btn btn-sm join-item gap-1"
                                                            >
                                                                <EditIcon />
                                                                {t(k.SAVE)}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => deleteFolder(folder)}
                                                            className="my-1 btn p-3 bg-inherit"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {currentPage === "Folders" && folders.length === 0 && (
                            <div className="card mt-3 mb-3">
                                <div className="card-body pt-2">
                                    <h5 className="card-title">
                                        {t(k.TO_GET_STARTED_CREATE_A_FOLDE)}
                                    </h5>
                                </div>
                            </div>
                        )}

                        {currentPage === "Export" && (
                            <>
                                <div className="card mt-3 mb-3">
                                    <div className="card-body pb-1 pt-1">
                                        <h2 className="card-title">{t(k.EXPORT_PROMPTS)}</h2>
                                        <p>{t(k.THESE_FILES_CAN_BE_USED_TO_TRA)}</p>
                                        <button className="btn" onClick={() => exportCsv()}>
                                            {" "}
                                            {t(k.EXPORT_CSV)}{" "}
                                        </button>
                                        <button className="btn" onClick={exportJson}>
                                            {" "}
                                            {t(k.EXPORT_JSON)}{" "}
                                        </button>
                                    </div>
                                </div>
                                <div className="card mt-3 mb-3">
                                    <div className="card-body pb-1 pt-1">
                                        <h2 className="card-title">{t(k.IMPORT_PROMPTS)}</h2>
                                        <p>
                                            {t(k.USE_THIS)}{" "}
                                            <a
                                                className="link link-primary"
                                                onClick={downloadTemplate}
                                            >
                                                {t(k.CSV_TEMPLATE)}
                                            </a>{" "}
                                            {t(k.TO_IMPORT_PROMPTS)}
                                        </p>
                                        <button className="m-2 btn" onClick={openFileSelect}>
                                            <label
                                                id="import-label"
                                                className="clickable"
                                                htmlFor="import-any"
                                            >
                                                {t(k.IMPORT_CSV)}
                                            </label>
                                            <input
                                                onChange={importAny}
                                                type="file"
                                                accept=".csv"
                                                id="import"
                                                className="hidden-trick"
                                            />
                                        </button>
                                    </div>
                                </div>
                                <div className="card mt-3 mb-3">
                                    <div className="card-body pt-0">
                                        <h5 className="card-title">
                                            {t(k.DANGER_ZONE_MASS_DELETE)}
                                        </h5>
                                        <p>{t(k.MASS_DELETE_YOUR_PROMPTS_AND_F)}</p>
                                        <button className="btn" onClick={showConfirm}>
                                            {" "}
                                            {t(k.DELETE_ALL_PROMPTS_FOLDERS)}{" "}
                                        </button>
                                        {confirmDelete && (
                                            <button
                                                onClick={deletePrompts}
                                                className="btn bg-warning"
                                            >
                                                {t(k.CONFIRM_DELETE)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="modal-backdrop">
                    <button id="close_modal" onClick={closeModal}>
                        {t(k.CLOSE)}
                    </button>
                </div>
            </div>
        </>
    )
}
