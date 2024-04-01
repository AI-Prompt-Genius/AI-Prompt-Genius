export default function Ad() {
    //const lang = localStorage.getItem("lng") ?? "en"

    return (
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
    )
}
/* 
<p>
            <a
                className={"link link-primary"}
                href={"https://link.aipromptgenius.app/max-ai-me-jan2"}
                target={"_blank"}
            >
                Sponsored by MaxAI.me
            </a>{" "}
            - Use 1-click AI Anywhere
        </p>
 */
