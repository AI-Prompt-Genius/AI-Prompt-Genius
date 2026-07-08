import Logo from "./Logo"
import React from "react"
import Head2 from "./Head2"
import Head4 from "./Head4"
import hotkey from "../images/hotkeydemo.webp"
import k from "../i18n/keys"
import { useTranslation } from "react-i18next"

export default function HotkeyUpdateModal() {
    const { t } = useTranslation()
    function openKeyboardShortcuts() {
        console.log("OPENING!")
        // Create the message object
        var message = {
            message: "openShortcuts",
        }

        // Stringify the object to send via postMessage
        var messageString = JSON.stringify(message)

        // Send the message to the parent window
        window.parent.postMessage(messageString, "*")
    }

    function closeModal() {
        ;(document.getElementById("hotkeyModal") as HTMLInputElement).checked = false
    }

    localStorage.setItem("seen_hotkey_update_12_13", "true")

    return (
        <>
            <input
                defaultChecked
                type="checkbox"
                id="hotkeyModal"
                className="modal-toggle hidden"
            />
            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    <div className={"mb-4 p-4"}>
                        <Head2>{t(k.HOTKEY_IS_BACK)}</Head2>
                        <Head4>{t(k.HOTKEY_ACCESS_YOUR_PROMPTS)}</Head4>
                        <img className={"max-w-full w-fit max-h-96"} src={hotkey} />
                        <p className={"my-2"}>
                            To set it up, go to{" "}
                            <span className={"link link-primary"} onClick={openKeyboardShortcuts}>
                                {t(k.CHROME_EXTENSIONS_SHORTCUTS)}
                            </span>{" "}
                            {t(k.HOTKEY_SETUP_INSTRUCTIONS)}
                        </p>
                        <Head2>{t(k.HOTKEY_FEEDBACK_TITLE)}</Head2>
                        <p className={"mb-3"}>
                            <a
                                className={"link link-primary"}
                                href={"https://link.aipromptgenius.app/survey"}
                                target={"_blank"}
                            >
                                {t(k.HOTKEY_FEEDBACK_LINK)}
                            </a>{" "}
                            {t(k.HOTKEY_FEEDBACK_TAIL)}
                        </p>
                        <Head2>{t(k.HOTKEY_OUTAGE_TITLE)}</Head2>
                        <p>{t(k.HOTKEY_OUTAGE_BODY)}</p>
                    </div>
                    <div className={"mb-2 p-3"}>
                        <button className={"btn disabled:hidden"} onClick={closeModal}>
                            {t(k.CLOSE)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
