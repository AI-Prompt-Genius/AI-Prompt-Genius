import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import k from "../i18n/keys"
import { isSignedIn } from "../auth/customAuth"
import { OPEN_AUTH_EVENT } from "./AuthModal"
import { BracesIcon, SyncIcon, ChatBubbleIcon } from "./icons/Icons"

const FEEDBACK_FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdB-AGtNIua6XJuLW1XeLSxvLHCjZdpNL7NJSL-FkgQi2XEig/viewform?usp=header"

export default function NewFeaturesModal() {
    const { t } = useTranslation()
    const [signedIn, setSignedIn] = useState(isSignedIn())

    useEffect(() => {
        const update = () => setSignedIn(isSignedIn())
        window.addEventListener("storage", update)
        window.addEventListener("auth-changed", update)
        return () => {
            window.removeEventListener("storage", update)
            window.removeEventListener("auth-changed", update)
        }
    }, [])

    function closeModal() {
        ;(document.getElementById("newFeaturesModal") as HTMLInputElement).checked = false
        localStorage.setItem("newFeaturesModalDismissed", "true")
    }

    function handleEnableSync() {
        localStorage.setItem("syncPreference", "cloud")
        if (!signedIn) {
            window.dispatchEvent(new Event(OPEN_AUTH_EVENT))
        }
        closeModal()
    }

    function handleFeedback() {
        window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer")
    }

    return (
        <>
            <input
                defaultChecked
                type="checkbox"
                id="newFeaturesModal"
                className="modal-toggle hidden"
            />

            <div className="modal">
                <div className="modal-box max-w-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-4 text-center flex-shrink-0">
                        <h2 className="text-xl sm:text-2xl font-bold">
                            {t(k.NEW_FEATURES_TITLE)}
                        </h2>
                        <p className="text-sm text-base-content/70 mt-1">
                            {t(k.NEW_FEATURES_SUBTITLE)}
                        </p>
                    </div>

                    <div className="px-4 sm:px-6 py-4 space-y-2 overflow-y-auto flex-1">
                        <FeatureCard
                            icon={<BracesIcon />}
                            title={t(k.NEW_FEATURES_TYPED_VARIABLES)}
                            description={t(k.NEW_FEATURES_TYPED_VARIABLES_DESC)}
                        />
                        <FeatureCard
                            icon={<SyncIcon />}
                            title={t(k.NEW_FEATURES_CLOUD_SYNC)}
                            description={t(k.NEW_FEATURES_CLOUD_SYNC_DESC)}
                        />
                        <FeatureCard
                            icon={<ChatBubbleIcon />}
                            title={t(k.NEW_FEATURES_FEEDBACK_TITLE)}
                            description={t(k.NEW_FEATURES_FEEDBACK_DESC)}
                        >
                            <button
                                className="btn btn-sm btn-outline mt-2"
                                onClick={handleFeedback}
                            >
                                {t(k.NEW_FEATURES_FEEDBACK_CTA)}
                            </button>
                        </FeatureCard>
                    </div>

                    <div className="px-4 sm:px-6 pb-4 pt-2 flex flex-col-reverse sm:flex-row gap-2 justify-center items-center flex-shrink-0 border-t border-base-content/10">
                        <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                            {t(k.NEW_FEATURES_SKIP)}
                        </button>
                        <button
                            className="btn btn-primary btn-sm w-full sm:w-auto"
                            onClick={handleEnableSync}
                        >
                            {t(k.NEW_FEATURES_ENABLE_SYNC)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

function FeatureCard({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode
    title: string
    description: string
    children?: React.ReactNode
}) {
    return (
        <div className="flex items-start gap-4 rounded-2xl border border-base-content/10 bg-base-200/50 p-4 transition-colors hover:bg-base-200">
            <div className="flex-none flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>
            <div className="min-w-0">
                <h3 className="font-semibold leading-tight">{title}</h3>
                <p className="text-sm text-base-content/70 mt-1">{description}</p>
                {children}
            </div>
        </div>
    )
}
