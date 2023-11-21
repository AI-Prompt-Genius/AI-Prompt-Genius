import i18n from "i18next"
import k from "./../i18n/keys"
import React from "react"
import Head4 from "./Head4.jsx"

const ShortcutInfo = () => {
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
        <div>
            <Head4>{i18n.t(k.SETUP_KEYBOARD_SHORTCUTS)}</Head4>
            <p>
                {i18n.t(k.SETUP_KEYBOARD_SHORTCUTS_TO_OP)}{" "}
                <span className={"link link-primary"} onClick={openKeyboardShortcuts}>
                    {i18n.t(k.CHROME_EXTENSIONS_SHORTCUTS)}
                </span>{" "}
                {i18n.t(k.TO_GET_STARTED)}
            </p>
        </div>
    )
}

export default ShortcutInfo
