import { useEffect, useState, useRef } from "react"

function useChromeStorage(key, defaultValue, callback) {
    const [value, setValue] = useState(defaultValue)
    const messageRef = useRef(null)

    const sendMessage = () => {
        console.log(messageRef.current)
        if (messageRef.current) {
            window.parent.postMessage(JSON.stringify(messageRef.current), "*") // Use "*" for all windows
            messageRef.current = null
        }
    }

    useEffect(() => {
        // Send GET message on component mount
        messageRef.current = { type: "GET", key }
        sendMessage()
    }, [])

    const setter = newValue => {
        setValue(newValue)
        messageRef.current = { type: "SET", key, value: newValue }
        sendMessage()
        if (callback) {
            callback(newValue) // Call the provided callback with the new value
        }
    }

    // Handle messages received from the background script via postMessage
    window.addEventListener("message", event => {
        if (event.source !== window && event.data && event.data.type) {
            const message = event.data
            if (message.type === "SET" && message.key === key) {
                setValue(message.value)
            }
        }
    })

    return [value, setter]
}

export default useChromeStorage
