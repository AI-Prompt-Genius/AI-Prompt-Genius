import React, { useState } from "react"
import k from "../i18n/keys.js"
import { useTranslation } from "react-i18next"
import Logo from "./Logo.jsx"
import LanguageSelect from "./LanguageSelect.jsx"
import Head4 from "./Head4.jsx"
import Head2 from "./Head2.jsx"
import { getCurrentTimestamp, getObject, newFolder, setObject } from "./js/utils.js"

function TransferModal() {
    const { t, i18n } = useTranslation()
    const [page, setPage] = useState(1)
    const MAX_PAGE_NUM = 4

    const [categoryMode, setCategoryMode] = useState("none")

    function nextPage() {
        if (page + 1 === 2) {
            updatePrompts(categoryMode)
        }
        setPage(page + 1)
    }

    function prevPage() {
        setPage(page - 1)
    }

    const handleSelectChange = event => {
        setCategoryMode(event.target.value)
        updatePrompts(event.target.value)
    }

    function updatePrompts(categoryMode = categoryMode) {
        const oldPrompts = getObject("transferPrompts", null)
        if (oldPrompts) {
            const newPrompts = oldPrompts.map(prompt => {
                const { title, text, id, category } = prompt
                let tags = prompt.tags
                let folder = ""

                if (categoryMode === "tag") {
                    tags = [...new Set([...tags, category])]
                    folder = ""
                    setObject("folders", [])
                } else if (categoryMode === "folder" && category !== "" && category !== " ") {
                    folder = category
                    setObject("folders", newFolder(folder))
                } else {
                    setObject("folders", [])
                }
                return {
                    title,
                    text,
                    tags,
                    folder,
                    id,
                    lastChanged: getCurrentTimestamp(),
                    description: "",
                }
            })
            console.log(newPrompts)
            setObject("prompts", newPrompts)
        } else {
            console.error("ERROR TRANSFERRING PROMPTS!")
            // call transfer prompts after three second timeout
            setTimeout(updatePrompts, 3000)
        }
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
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    {page === 1 && (
                        <div className={"mb-4"}>
                            <Head2>Welcome to the new AI Prompt Genius</Head2>
                            <p className="text-center text-xl text-gray-600 mb-4">
                                Prompt Genius just got an update
                            </p>
                            <Head4>{t(k.SELECT_LANG)}</Head4>
                            <LanguageSelect />
                        </div>
                    )}
                    {page === 2 && (
                        <div className="p-4">
                            <Head2>What's new?</Head2>
                            <Head4>Categories are now folders</Head4>
                            <p className="text-gray-600 mb-4">
                                You now get to pick your own categories - now called folders.
                            </p>

                            <Head4>Use AI Prompt Genius anywhere</Head4>
                            <p className="text-gray-600 mb-4">
                                AI Prompt Genius is now self-contained. You can access it anywhere
                                by clicking the extension icon or opening the sidebar (Chrome 116+).
                                Work with any AI model of your choice.
                            </p>

                            <Head4>More robust import and cloud syncing features</Head4>
                            <p>
                                You can mass import prompts using a CSV template. Cloud syncing is
                                now more reliable and prominent.
                            </p>

                            <Head4>New sleek UI</Head4>
                            <p>The new UI is more cohesive and modern.</p>

                            <Head4>History, themes, and chat export are being retired</Head4>
                            <p className={"text-gray-600 mb-4"}>
                                You can download a copy of your data{" "}
                                <span className={"link-primary link"}> JSON here.</span> You can{" "}
                                <a className="link link-primary" target={"_blank"} href={""}>
                                    click here
                                </a>
                                to learn more about how to continue using these features.
                            </p>
                        </div>
                    )}
                    {page === 3 && (
                        <div className="p-4">
                            <div className={"flex align-middle"}>
                                <div className={"inline mr-3"}>
                                    <Head4>Import categories as</Head4>
                                </div>
                                <select
                                    className="select select-bordered"
                                    value={categoryMode}
                                    onChange={handleSelectChange}>
                                    <option value={"none"}>None</option>
                                    <option value={"folder"}>Folder</option>
                                    <option value={"tag"}>Tag</option>
                                </select>
                            </div>
                            <p className={"mb-3"}>
                                If you want to continue using the legacy categories, you can choose
                                to import them as tags or folders.
                            </p>
                            <Head2>Next Steps</Head2>
                            <Head4>Setup keyboard shortcuts</Head4>
                            <p>
                                Setup keyboard shortcuts to open the sidebar (Chrome 116+) or open
                                the popup panel with your prompts. Go to
                                <a
                                    className={"link link-primary"}
                                    href={"chrome://extensions/shortcuts"}
                                    target={"_blank"}>
                                    chrome://extensions/shortcuts
                                </a>
                                to get started.
                            </p>
                        </div>
                    )}
                    <div className={"absolute bottom-0 mb-2 p-3"}>
                        <button
                            disabled={page === 1}
                            className={"btn mr-3 disabled:hidden"}
                            onClick={prevPage}>
                            Back
                        </button>
                        <button
                            disabled={page === MAX_PAGE_NUM}
                            className={"btn disabled:hidden"}
                            onClick={nextPage}>
                            Next
                        </button>
                        <button disabled={page !== MAX_PAGE_NUM} className={"btn disabled:hidden"}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TransferModal
