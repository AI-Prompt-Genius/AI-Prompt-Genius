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
                        <img className={"w-full max-h-80"} src={hotkey} />
                        <p className={"my-2"}>
                            To set it up, go to{" "}
                            <span className={"link link-primary"} onClick={openKeyboardShortcuts}>
                                {t(k.CHROME_EXTENSIONS_SHORTCUTS)}
                            </span>{" "}
                            and choose a shortcut for "Launch Search" under AI Prompt Genius.
                        </p>
                        <Head2>
                            Give your feedback for a chance to win a $50 Amazon.com gift card
                        </Head2>
                        <p>
                            <a href={"https://link.aipromptgenius.app/survey"} target={"_blank"}>
                                Click here to participate{" "}
                            </a>{" "}
                            in a survey about the future of AI Prompt Genius (English only). Your feedback is appreciated.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
