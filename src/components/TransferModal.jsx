import React, { useState } from "react"
import k from "../i18n/keys.js"
import { useTranslation } from "react-i18next"
import Logo from "./Logo.jsx"
import LanguageSelect from "./LanguageSelect.jsx"
import Head4 from "./Head4.jsx"
import Head2 from "./Head2.jsx"
import { getCurrentTimestamp, getObject, newFolder, setObject } from "./js/utils.js"
import ShortcutInfo from "./ShortcutInfo.jsx"

function TransferModal() {
    const { t } = useTranslation()
    const [page, setPage] = useState(1)
    const MAX_PAGE_NUM = 3

    const [categoryMode, setCategoryMode] = useState("none")

    function nextPage() {
        if (page + 1 === 2) {
            updatePrompts(categoryMode)
        } else if (page + 1 === 2) {
            clearStorage()
        }
        setPage(page + 1)
    }

    if (page === 1){
        const recievedTransfer = getObject("transferred", false)
        if (!recievedTransfer){
            var message = {
                message: "getTransfer",
            }

            // Stringify the object to send via postMessage
            var messageString = JSON.stringify(message)

            // Send the message to the parent window
            window.parent.postMessage(messageString, "*")
        }
    }

    function clearStorage() {
        const prompts = getObject("prompts", [])
        if (prompts !== []) {
            console.log("Clearing storage")
            // Create the message object
            var message = {
                message: "clearStorage",
            }

            // Stringify the object to send via postMessage
            var messageString = JSON.stringify(message)

            // Send the message to the parent window
            window.parent.postMessage(messageString, "*")
        }
    }

    function prevPage() {
        setPage(page - 1)
    }

    const handleSelectChange = event => {
        setCategoryMode(event.target.value)
        updatePrompts(event.target.value)
    }

    function downloadArchive() {
        console.log("Archive ALL!")
        // Create the message object
        var message = {
            message: "downloadArchive",
        }

        // Stringify the object to send via postMessage
        var messageString = JSON.stringify(message)

        // Send the message to the parent window
        window.parent.postMessage(messageString, "*")
    }

    function updatePrompts(categoryMode = categoryMode) {
        const oldPrompts = getObject("transferPrompts", null)
        if (oldPrompts) {
            const newPrompts = oldPrompts.map(prompt => {
                const { title, text, id, category } = prompt
                let tags = prompt.tags
                let folder = ""

                if (categoryMode === "tag" && category !== "" && category !== " ") {
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

    function closeModal() {
        document.getElementById("transferModal").checked = false
        document.location.href = "https://lib.aipromptgenius.app/?fullscreen=true"
    }

    return (
        <>
            <input
                defaultChecked
                type="checkbox"
                id="transferModal"
                className="modal-toggle hidden"
            />

            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    {page === 1 && (
                        <div className={"mb-4"}>
                            <h2 className="text-2xl font-bold text-center text-gray-800 mt-6 mb-3">
                                {t(k.WELCOME_TO_THE_NEW_AI_PROMPT_G)}
                            </h2>
                            <p className="text-center text-xl text-gray-600 mb-4">
                                {t(k.PROMPT_GENIUS_JUST_GOT_AN_UPDA)}
                            </p>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">
                                {t(k.SELECT_LANG)}
                            </h4>
                            <div className={"mb-4"}><LanguageSelect /></div>
                            <iframe width="470" height="281" src="https://www.youtube-nocookie.com/embed/R9m3wWOlIAY?si=2q2weUV9dP3guoh1" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                        </div>
                    )}

                    {page === 2 && (
                        <div className="p-4">
                            <Head2>{t(k.WHAT_S_NEW)}</Head2>
                            <Head4>{t(k.CATEGORIES_ARE_NOW_FOLDERS)}</Head4>
                            <p className="text-gray-600 mb-4">
                                {t(k.YOU_NOW_GET_TO_PICK_YOUR_OWN_C)}
                            </p>

                            <Head4>{t(k.USE_AI_PROMPT_GENIUS_ANYWHERE)}</Head4>
                            <p className="text-gray-600 mb-4">
                                {t(k.AI_PROMPT_GENIUS_IS_NOW_SELF_C)}
                            </p>

                            <Head4>{t(k.MORE_ROBUST_IMPORT_AND_CLOUD_S)}</Head4>
                            <p>{t(k.YOU_CAN_MASS_IMPORT_PROMPTS_US)}</p>

                            <Head4>{t(k.NEW_SLEEK_UI)}</Head4>
                            <p>{t(k.THE_NEW_UI_IS_MORE_COHESIVE_AN)}</p>

                            <Head4>{t(k.HISTORY_THEMES_AND_CHAT_EXPO)}</Head4>
                            <p className={"text-gray-600 mb-4"}>
                                {t(k.YOU_CAN_DOWNLOAD_A_COPY_OF_YOU)}{" "}
                                <span className={"link-primary link"} onClick={downloadArchive}>
                                    {" "}
                                    {t(k.DATA_IN_JSON_HERE)}
                                </span>{" "}
                                {t(k.CLICK)}{" "}
                                <a
                                    className="link link-primary"
                                    target={"_blank"}
                                    href={"https://link.aipromptgenius.app/mJ0gg6"}
                                >
                                    {t(k.HERE)}
                                </a>{" "}
                                {t(k.TO_LEARN_MORE_ABOUT_THE_FUTURE)}
                            </p>
                        </div>
                    )}

                    {page === 3 && (
                        <div className="p-4">
                            <div className={"flex align-middle"}>
                                <div className={"inline mr-3"}>
                                    <Head4>{t(k.IMPORT_CATEGORIES_AS)}</Head4>
                                </div>
                                <select
                                    className="select select-bordered"
                                    value={categoryMode}
                                    onChange={handleSelectChange}
                                >
                                    <option value={"none"}>{t(k.NONE)}</option>
                                    <option value={"folder"}>{t(k.FOLDER1)}</option>
                                    <option value={"tag"}>{t(k.TAG)}</option>
                                </select>
                            </div>
                            <p className={"mb-5"}>{t(k.IF_YOU_WANT_TO_CONTINUE_USING)}</p>
                            <Head2>{t(k.NEXT_STEPS)}</Head2>
                            <ShortcutInfo />
                            <Head4>{t(k.SETUP_CLOUD_SYNCING_EXPLORE)}</Head4>
                            <p>{t(k.WANT_TO_SYNC_YOUR_PROMPTS_ACRO)}</p>
                        </div>
                    )}

                    <div className={"absolute bottom-0 mb-2 p-3"}>
                        <button
                            disabled={page === 1}
                            className={"btn mr-3 disabled:hidden"}
                            onClick={prevPage}
                        >
                            {t(k.BACK)}
                        </button>
                        <button
                            disabled={page === MAX_PAGE_NUM}
                            className={"btn disabled:hidden"}
                            onClick={nextPage}
                        >
                            {t(k.NEXT)}
                        </button>
                        <button
                            disabled={page !== MAX_PAGE_NUM}
                            className={"btn disabled:hidden"}
                            onClick={closeModal}
                        >
                            {t(k.CLOSE)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TransferModal
