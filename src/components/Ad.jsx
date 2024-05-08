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
                        href={"https://link.aipromptgenius.app/max-ai-text"}
                        target={"_blank"}
                    >
                        Sponsored by MaxAI. - Use 1-click AI Anywhere
                    </a>{" "}
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
