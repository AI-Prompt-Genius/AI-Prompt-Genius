import React from "react"
import Logo from "./Logo.jsx"
import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import k from "../i18n/keys.js";
import {useTranslation} from "react-i18next";

export function ProUpgradeModal() {
    const { t } = useTranslation();
    function closeModal() {
        document.getElementById("proUpgradeModal").checked = false
    }

    return (
        <>
            <input type="checkbox" id="proUpgradeModal" className="modal-toggle hidden" />
            <div className="modal" role={"dialog"}>
                <div className="modal-box max-w-[1000px] h-full">
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    <div className={"p-4"}>
                        <Head2>Liked that theme? Upgrade to Pro!</Head2>
                        <Head4>Features:</Head4>
                        <ul className={"list-disc ml-6"}>
                            <li>No ads! Including popup windows & text ads.</li>
                            <li>10 new themes, including cyberpunk, luxury, and more!</li>
                            <li>Support a small developer</li>
                        </ul>
                        <a href={"https://link.aipromptgenius.app/upgrade-pro"} target={"_blank"} className={"btn my-3"}>Buy a pro license</a>
                    </div>
                </div>
                <label className="modal-backdrop" htmlFor="proUpgradeModal">{t(k.CLOSE)}</label>
            </div>
        </>
    )
}
