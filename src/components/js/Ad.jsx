export default function Ad() {
    const lang = localStorage.getItem("lng") ?? "en"

    return (
        <>
        {lang === "en" &&
        <p className={"text-sm"}>
            <a
                className={"link link-primary"}
                href={"https://link.aipromptgenius.app/survey"}
                target={"_blank"}
            >
                Click here
            </a>{" "}
            to give your feedback about AI Prompt Genius for a chance to win a $50 Amazon.com gift
            card
        </p>
        }
        </>
    )
}
