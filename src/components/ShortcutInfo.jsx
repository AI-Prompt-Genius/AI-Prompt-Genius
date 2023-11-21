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
            <Head4>Setup keyboard shortcuts</Head4>
            <p>
                Setup keyboard shortcuts to open the sidebar (Chrome 116+) or open the popup panel
                with your prompts. Go to{" "}
                <span className={"link link-primary"} onClick={openKeyboardShortcuts}>
                    chrome://extensions/shortcuts
                </span>{" "}
                to get started.
            </p>
        </div>
    )
}

export default ShortcutInfo
