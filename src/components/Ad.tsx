import React from "react"
import { useProStatus } from "./js/pro"
import { AdsOnBreadSlot } from "@adsonbread/react"
import { ThemeContext } from "./ThemeContext"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { CrownIcon } from "./icons/Icons"
import k from "../i18n/keys"
import "./Ad.css"

function getAdsTheme(theme: string) {
    const darkThemes = ["dark", "night", "forest", "luxury"]
    return darkThemes.includes(theme) ? "dark" : "light"
}

export default function Ad() {
    const { t } = useTranslation()
    const isPro = useProStatus()
    const container = React.useRef<HTMLDivElement>(null)
    const [footer, setFooter] = React.useState<HTMLElement | null>(null)
    const { theme } = React.useContext(ThemeContext)
    const lang = localStorage.getItem("lng") ?? "en"
    const adTheme = getAdsTheme(theme)

    React.useEffect(() => {
        const element = container.current
        if (!element) {
            setFooter(null)
            return
        }

        // The SDK owns the attribution row and renders it after the ad loads.
        // Keep the upgrade link in that row, including when the SDK replaces the ad.
        const findFooter = () =>
            setFooter(element.querySelector<HTMLElement>("[data-adsonbread] > div:last-child"))
        findFooter()
        const observer = new MutationObserver(findFooter)
        observer.observe(element, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [isPro])

    return (
        <>
            {!isPro && (
                <div className="ad-container" ref={container} data-ad-theme={adTheme}>
                    <AdsOnBreadSlot
                        apiKey="a164501b-2c0f-4ce1-a646-b680633f08ed"
                        placement="banner"
                        theme={adTheme}
                        language={lang}
                    />
                    {footer &&
                        createPortal(
                            <a
                                className="ad-remove-link"
                                href="https://link.aipromptgenius.app/upgrade-pro"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {t(k.REMOVE_ADS)}
                                <span aria-hidden="true">
                                    <CrownIcon />
                                </span>
                            </a>,
                            footer,
                        )}
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
