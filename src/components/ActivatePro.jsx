import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import { activateLicense, getProStatus } from "./js/pro.js"
import { useState } from "react"
import { CrownIcon } from "./icons/Icons.jsx"
import { useTranslation } from "react-i18next"
import k from "./../i18n/keys"
export function ActivatePro(props) {
    const { t, i18n } = useTranslation()

    const [isPro, setPro] = useState(getProStatus())
    const licenseKey = localStorage.getItem("pro_key") ?? ""

    async function activatePro() {
        const key = document.getElementById("licenseKey").value
        const success = await activateLicense(key)
        if (success === "full"){
            props.showToast(t(k.OUT_OF_SEATS))
        }
        else if (success) {
            props.showToast(t(k.SUCCESSFULLY_ACTIVATED_PRO))
            document.getElementById("licenseKey").disabled = true
            setPro(true)
        } else {
            props.showToast(t(k.ERROR_ACTIVATING_PRO))
        }
    }

    return (
        <div>
            {!isPro ? (
                <Head2>{t(k.ACTIVATE_PRO_LICENSE)}</Head2>
            ) : (
                <Head2>{t(k.MANAGE_PRO_SUBSCRIPTION)}</Head2>
            )}
            {!props.in_settings && !isPro && <p>{t(k.ACTIVATE_LICENSE_IN_SETTINGS)}</p>}
            <div className="join my-2">
                {isPro ? (
                    <input
                        disabled
                        id={"licenseKey"}
                        defaultValue={licenseKey}
                        className={`input input-bordered join-item input-disabled`}
                        placeholder={t(k.LICENSE_KEY)}
                    />
                ) : (
                    <input
                        id={"licenseKey"}
                        className={`input input-bordered join-item`}
                        placeholder={t(k.LICENSE_KEY)}
                    />
                )}
                <button
                    className={`btn btn-outline border-width-[1px] join-item ${
                        isPro ? "btn-disabled" : ""
                    }`}
                    onClick={activatePro}
                >
                    {t(k.ACTIVATE)}
                </button>
            </div>
            {isPro && (
                <p className={"my-3"}>
                    <a
                        className={"link link-primary"}
                        target={"_blank"}
                        href={
                            "https://customers.gumroad.com/article/192-how-do-i-cancel-my-subscription-membership"
                        }
                    >
                        {t(k.CANCEL_MY_SUBSCRIPTION)}
                    </a>
                </p>
            )}
        </div>
    )
}
