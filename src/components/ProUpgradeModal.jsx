import React from "react"
import Logo from "./Logo.jsx"
import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import k from "../i18n/keys.js"
import { useTranslation } from "react-i18next"
import { ActivatePro } from "./ActivatePro.jsx"
import { ProFeatures } from "./ProFeatures.jsx"

export function ProUpgradeModal(props) {
    const { t } = useTranslation()

    return (
        <>
            <input type="checkbox" id="proUpgradeModal" className="modal-toggle hidden" />
            <div className="modal" role={"dialog"}>
                <div className="modal-box max-w-[1000px] h-full">
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    <ProFeatures />
                    <div className={"px-4"}>
                        <ActivatePro in_settings={false} showToast={props.showToast} />
                    </div>
                </div>
                <label className="modal-backdrop" htmlFor="proUpgradeModal">
                    {t(k.CLOSE)}
                </label>
            </div>
        </>
    )
}
