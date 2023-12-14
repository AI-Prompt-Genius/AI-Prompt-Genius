import Logo from "./Logo.jsx"
import React from "react"
import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import hotkey from "../images/hotkeydemo.webp"
import k from "../i18n/keys.js"
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
        document.getElementById("hotkeyModal").checked = false
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
                        <Head2>Hotkey is back!</Head2>
                        <Head4>
                            Access your prompts with a customizable hotkey shortcut on any page.
                        </Head4>
                        <img className={"max-w-full w-fit max-h-96"} src={hotkey} />
                        <p className={"my-2"}>
                            To set it up, go to{" "}
                            <span className={"link link-primary"} onClick={openKeyboardShortcuts}>
                                {t(k.CHROME_EXTENSIONS_SHORTCUTS)}
                            </span>{" "}
                            and choose a shortcut for "Launch Search" under AI Prompt Genius. Then
                            use that shortcut on any page, for example, ChatGPT.
                        </p>
                        <Head2>
                            Give your feedback for a chance to win a $50 Amazon.com gift card
                        </Head2>
                        <p className={"mb-3"}>
                            <a
                                className={"link link-primary"}
                                href={"https://link.aipromptgenius.app/survey"}
                                target={"_blank"}
                            >
                                Click here to participate
                            </a>{" "}
                            in a survey about the future of AI Prompt Genius (English only). Your
                            feedback is much appreciated!
                        </p>
                        <Head2>Acknowledgement of outage</Head2>
                        <p>
                            We'd like to apologize for any disruption that may have occurred
                            Tuesday the 12th. As always, you can reach out to
                            aipromptgenius@gmail.com for support.
                        </p>
                    </div>
                    <div className={"mb-2 p-3"}>
                        <button
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
