import Head2 from "./Head2.jsx";
import Head4 from "./Head4.jsx";
import React from "react";
import {useTranslation} from "react-i18next";
import k from "../i18n/keys.js"

export function ProFeatures(){
    const { t } = useTranslation()

    return (
        <div className={"p-4"}>
            <Head2>{t(k.LIKED_THEME)}</Head2>
            <Head4>{t(k.FEATURES)}</Head4>
            <ul className={"list-disc ml-6"}>
                <li>{t(k.NO_ADS)}</li>
                <li>
                    {t(k.ACCESS_TO_NEW_THEMES)}
                </li>
                <li>{t(k.SUPPORT_A_SMALL_DEVELOPER)}</li>
            </ul>
            <a
                href={"https://link.aipromptgenius.app/upgrade-pro"}
                target={"_blank"}
                className={"btn btn-outline my-3"}
            >
                {t(k.BUY_A_PRO_LICENSE)}
            </a>
        </div>
    )
}