import { useState } from "react"
import { getProStatus } from "./js/pro.js"

export default function Ad() {
    const isPro = getProStatus()

    return (
        <>
             {!isPro && (
                 <p className={"text-sm"}>
                     <a
                         className={"link link-primary"}
                         href={"https://www.aipromptgenius.app/advertise-with-us/"}
                         target={"_blank"}
                     >
                         Interested in seeing your buisness grow? Contact us to advertise here
                     </a>{" "}
                     Access AI with any webpage
                 </p>
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
