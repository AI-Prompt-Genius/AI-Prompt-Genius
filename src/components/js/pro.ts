import { sendMessageToParent } from "./utils.js"

export function getProStatus() {
    let isPro = localStorage.getItem("pro") ?? false
    return isPro === "true"
}

export async function updateProStatus() {
    let proKey = localStorage.getItem("pro_key") ?? null
    const currentTime = new Date().getTime()
    localStorage.setItem("last_checked_pro", currentTime.toString())
    if (proKey !== null) {
        const verifyPro = await notFirstCheck(proKey)
        if (verifyPro) {
            localStorage.setItem("pro", "true")
            sendMessageToParent({ message: "pro_status", pro: true })
            return true
        } else {
            localStorage.removeItem("pro_key")
            localStorage.setItem("pro", "false")
            sendMessageToParent({ message: "pro_status", pro: false })
            return false
        }
    } else {
        localStorage.setItem("pro", "false")
        return false
    }
}

export async function activateLicense(license_key) {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `product_id=AkOGKEr0_Y0c3eZXKnTvDA==&license_key=${license_key}&increment_uses_count=true`,
    })

    const data = await response.json()
    const currentTime = new Date().getTime()
    localStorage.setItem("last_checked_pro", currentTime.toString())

    if (data.success) {
        if (data.uses > 8) {
            // caps users at 8 devices
            sendMessageToParent({ message: "pro_status", pro: false })
            localStorage.setItem("pro", "false")
            return "full"
        } else {
            localStorage.setItem("pro_key", license_key)
            localStorage.setItem("pro", "true")
            sendMessageToParent({ message: "pro_status", pro: true })
            return true
        }
    } else {
        localStorage.removeItem("pro_key")
        localStorage.setItem("pro", "false")
        sendMessageToParent({ message: "pro_status", pro: false })
        return false
    }
}

async function notFirstCheck(license_key) {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `product_id=AkOGKEr0_Y0c3eZXKnTvDA==&license_key=${license_key}&increment_uses_count=false`,
    })

    // Assuming the response is in JSON format
    const data = await response.json() // This line extracts the response data as a JavaScript object

    return data.success // true if pro
}
