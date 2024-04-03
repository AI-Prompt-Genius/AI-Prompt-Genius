import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import { activateLicense, getProStatus } from "./js/pro.js"
import { useState } from "react"
import {CrownIcon} from "./icons/Icons.jsx";

export function ActivatePro(props) {
    const [isPro, setPro] = useState(getProStatus())
    const licenseKey = localStorage.getItem("pro_key") ?? ""

    async function activatePro() {
        const key = document.getElementById("licenseKey").value
        const success = await activateLicense(key)
        if (success) {
            props.showToast("Successfully Activated Pro!")
            document.getElementById("licenseKey").disabled = true
            setPro(true)
        } else {
            props.showToast("Error activating pro. Make sure your license key is accurate")
        }
    }

    return (
        <div>
            {!isPro ? <Head2>Activate Pro License</Head2> : <Head2>Manage Pro Subscription</Head2>}
            {!props.in_settings && !isPro && <p>You can also activate your license anytime in settings</p>}
            <div className="join my-2">
                {isPro ? (
                    <input
                        id={"licenseKey"}
                        defaultValue={licenseKey}
                        className={`input input-bordered join-item input-disabled`}
                        placeholder="License Key"
                    />
                ) : (
                    <input
                        id={"licenseKey"}
                        className={`input input-bordered join-item`}
                        placeholder="License Key"
                    />
                )}
                <button
                    className={`btn btn-outline border-width-[1px] join-item ${
                        isPro ? "btn-disabled" : ""
                    }`}
                    onClick={activatePro}
                >
                    Activate
                </button>
            </div>
            {isPro &&
                <p className={"my-3"}>
                    <a className={"link link-primary"}
                       target={"_blank"}
                       href={
                           "https://customers.gumroad.com/article/192-how-do-i-cancel-my-subscription-membership"
                       }
                    >
                        Cancel my Subscription
                    </a>
                </p>
            }
        </div>
    )
}
