import React from "react"
import { useProStatus } from "./js/pro"
import { AdsOnBreadSlot } from "@adsonbread/react"
import { ThemeContext } from "./ThemeContext"
import { useTranslation } from "react-i18next"
import k from "../i18n/keys"
import { CrownIcon } from "./icons/Icons"

function getAdsTheme(theme: string) {
    const darkThemes = ["dark", "night", "forest", "luxury"]
    return darkThemes.includes(theme) ? "dark" : "light"
}

export default function Ad() {
    const { t } = useTranslation()
    const isPro = useProStatus()
    const { theme } = React.useContext(ThemeContext)
    const lang = localStorage.getItem("lng") ?? "en"
    const adTheme = getAdsTheme(theme)

    return (
        <>
            {!isPro && (
                <div className="w-full">
                    <AdsOnBreadSlot
                        apiKey="a164501b-2c0f-4ce1-a646-b680633f08ed"
                        placement="banner"
                        theme={adTheme}
                        language={lang}
                    />
                    <div className="mt-2 flex">
                        <a
                            className="btn btn-outline btn-sm"
                            href="https://link.aipromptgenius.app/upgrade-pro"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t(k.REMOVE_ADS)}
                            <span aria-hidden="true">
                                <CrownIcon />
                            </span>
                        </a>
                    </div>
                </div>
            )}
        </>
    )
}
/* 
{!isPro && (
                <p className={"text-sm"}>
                    <a
                        className={"link link-primary"}
                        href={
                            "https://chromewebstore.google.com/detail/ai-prompt-genius/jjdnakkfjnnbbckhifcfchagnpofjffo/reviews"
                        }
                        target={"_blank"}
                    >
                        Enjoying the extension? Leave a five star review.
                    </a>{" "}
                </p>
            )}
 */

//             {!isPro && (
//                 <p className={"text-sm"}>
//                     <a
//                         className={"link link-primary"}
//                         href={"https://link.aipromptgenius.app/ChatPlayground"}
//                         target={"_blank"}
//                     >
//                         Sponsored by Chat Playground
//                     </a>{" "}
//                     Achieve Better AI Answers 73% of the Time with Multiple Chatbots
//                 </p>
//             )}
//         </>
//     )
// }
