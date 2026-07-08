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
                <div className="modal-box max-w-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-8 pt-8 pb-6 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold">
                            {t(k.NEW_FEATURES_TITLE)}
                        </h2>
                        <p className="text-base-content/70 mt-2">
                            {t(k.NEW_FEATURES_SUBTITLE)}
                        </p>
                    </div>

                    <div className="px-6 sm:px-8 py-6 space-y-3">
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
                                className="btn btn-sm btn-outline mt-3"
                                onClick={handleFeedback}
                            >
                                {t(k.NEW_FEATURES_FEEDBACK_CTA)}
                            </button>
                        </FeatureCard>
                    </div>

                    <div className="px-6 sm:px-8 pb-8 pt-2 flex flex-col-reverse sm:flex-row gap-3 justify-center items-center">
                        <button className="btn btn-ghost" onClick={closeModal}>
                            {t(k.NEW_FEATURES_SKIP)}
                        </button>
                        <button
                            className="btn btn-primary w-full sm:w-auto"
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
