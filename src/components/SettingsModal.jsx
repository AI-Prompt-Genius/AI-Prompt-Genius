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
} from "./js/export.js"
import {
    checkProperties,
    getObject,
    removeFolder,
    removeFolderFromPrompts,
    setObject,
} from "./js/utils.js"
import LanguageSelect from "./LanguageSelect.jsx"
import { CrownIcon, GoogleDriveIcon, TrashIcon } from "./icons/Icons.jsx"
import { checkForResync, newToken, unlinkGsheet } from "./js/cloudSyncing.js"
import ShortcutInfo from "./ShortcutInfo.jsx"
import ReactGA from "react-ga4"
import { ActivatePro } from "./ActivatePro.jsx"
import { ProFeatures } from "./ProFeatures.jsx"
import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import { getProStatus } from "./js/pro.js"

export default function SettingsModal({
    setSettingsVisible,
    setFilteredPrompts,
    setSelectedFolder,
    setFilterTags,
    setSearchTerm,
    folders,
    setFolders,
    showToast,
    setPrompts,
    filterPrompts,
}) {
    const { t, i18n } = useTranslation()

    const [currentPage, setCurrentPage] = useState("General")
    const [confirmDelete, setConfirmDelete] = useState(false)

    const cloudSyncingEnabled = getObject("cloudSyncing", false) === true
    const sheetID = localStorage.getItem("sheetID")

    const isPro = getProStatus()

    const handlePageChange = page => {
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
        let input = document.querySelector("#import")
        let file = input.files[0]
        if (!file) {
            console.warn(`unable to find a valid file`)
            showToast(t(k.FILE_NOT_FOUND)) // Modified to use i18n key
            return
        }

        let reader = new FileReader()
        reader.onload = function (event) {
            const string = event.target.result
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

            let newPromptIds = getObject(newPrompts, [])
            for (const prompt of newPrompts) {
                newPromptIds.push(prompt.id)
            }
            setObject("newPrompts", newPromptIds)

            setObject("prompts", combinedPrompts)
            setFilteredPrompts(combinedPrompts)
            clearFilters()
            showToast(t(k.SUCCESSFULLY_IMPORTED_PROMPTS)) // Modified to use i18n key
            document.querySelector("#close_modal").click()
        }
        reader.onerror = function (event) {
            console.error(`Error occurred in file reader: `)
            console.error(event)
            showToast(t(k.INVALID_FILE)) // Modified to use i18n key
        }
        reader.readAsText(file)
    }

    function openFileSelect() {
        document.getElementById("import").click()
    }

    function deletePrompts() {
        const prompts = getObject("prompts", [])
        setObject(
            "deletedPrompts",
            prompts.map(prompt => prompt.id),
        )
        setObject("newPrompts", [])
        setObject("changedPrompts", [])

        localStorage.removeItem("prompts")
        localStorage.removeItem("folders")
        setFilteredPrompts([])
        clearFilters()
        setConfirmDelete(false)
        showToast(t(k.DELETED_ALL_PROMPTS_AND_FOLDERS)) // Modified to use i18n key
        location.reload()
    }

    function closeModal() {
        document.getElementById("settings-modal").checked = false
        setTimeout(() => setSettingsVisible(false), 100) // to allow for cool animation
    }

    function deleteFolder(name) {
        setFolders(removeFolder(name))
        setPrompts(removeFolderFromPrompts(name))
    }

    async function authThenResync() {
        localStorage.setItem("lastSynced", "0")
        checkForResync()
    }

    async function authThenUnlink() {
        newToken()
        localStorage.setItem("authTask", "unlinkGsheet")
    }

    function setupSync() {
        newToken()
        localStorage.setItem("authTask", "setupSync")
        ReactGA.event({
            category: "Settings Action",
            action: "Cloud Syncing Enabled",
            nonInteraction: false, // optional, true/false
            transport: "xhr", // optional, beacon/xhr/image
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
                                <a
                                    onClick={() => handlePageChange("Cloud")}
                                    className={`p-1 grow tab ${
                                        currentPage === "Cloud" ? "tab-active" : ""
                                    }`}
                                >
                                    {t(k.CLOUD_SYNCING)}
                                </a>
                            </ul>
                        </div>

                        {currentPage === "General" && (
                            <div className="card mt-3 mb-3">
                                <div className="card-body pt-2">
                                    <h5 className="card-title">{t(k.LANGUAGE)}</h5>
                                    <LanguageSelect />
                                    <ShortcutInfo />
                                    <div className={"mt-3"}>
                                        {!isPro && (
                                            <div>
                                                <Head2>{t(k.UPGRADE_TO_PRO)}</Head2>
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
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentPage === "Folders" && folders.length > 0 && (
                            <div className="card mt-3 mb-3">
                                <div className="card-body pt-2">
                                    <h5 className="card-title">{t(k.DELETE_FOLDERS)}</h5>
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
                                                    <td>{folder}</td>
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

                        {currentPage === "Cloud" && (
                            <div className="card mt-3 mb-3">
                                {!cloudSyncingEnabled && (
                                    <div className="card-body pt-2">
                                        <h5 className="card-title">
                                            {t(k.SYNC_PROMPTS_VIA_GOOGLE_SHEETS)}
                                        </h5>
                                        <button onClick={setupSync} className="btn">
                                            {t(k.LINK_GOOGLE_SHEETS)} <GoogleDriveIcon />
                                        </button>
                                    </div>
                                )}

                                {cloudSyncingEnabled && (
                                    <div className="card-body pt-2">
                                        <h5 className="card-title">{t(k.CLOUD_SYNCING)}</h5>
                                        <button className={"btn"} onClick={authThenResync}>
                                            {t(k.MANUALLY_RESYNC)}
                                        </button>
                                        <button className="btn" onClick={authThenUnlink}>
                                            {t(k.DISABLE_CLOUD_SYNCING)}
                                        </button>
                                        <a
                                            className={"link link-primary"}
                                            href={`https://docs.google.com/spreadsheets/d/${sheetID}`}
                                            target="_blank"
                                        >
                                            {t(k.VIEW_LINKED_SHEET)}
                                        </a>
                                    </div>
                                )}
                            </div>
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
