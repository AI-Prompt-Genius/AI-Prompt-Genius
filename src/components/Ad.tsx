import React from "react"
import { getProStatus } from "./js/pro.js"
import { AdsOnBreadSlot } from '@adsonbread/react'
import { ThemeContext } from "./ThemeContext.jsx"

function getAdsTheme(theme) {
    const darkThemes = ["dark", "night", "forest", "luxury"]
    return darkThemes.includes(theme) ? "dark" : "light"
}

export default function Ad() {
    const isPro = getProStatus()
    const { theme } = React.useContext(ThemeContext)
    const lang = localStorage.getItem("lng") ?? "en"
    const adTheme = getAdsTheme(theme)

    return (
        <>
             {!isPro && (
                 <AdsOnBreadSlot
                apiKey="a164501b-2c0f-4ce1-a646-b680633f08ed"
                placement="banner"
                theme={adTheme}
                language={lang}
                />
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
