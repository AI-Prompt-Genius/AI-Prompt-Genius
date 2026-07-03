import i18n from "i18next"
import k from "./../i18n/keys"
import Logo from "./Logo"
import React, { useState } from "react"
import Head2 from "./Head2"
import Head4 from "./Head4"
import ShortcutInfo from "./ShortcutInfo"
import LanguageSelect from "./LanguageSelect"
import SyncChoice from "./SyncChoice"
import { useTranslation } from "react-i18next"

function OnboardingModal() {
    const [page, setPage] = useState(1)
    const MAX_PAGE_NUM = 3

    const { t } = useTranslation()

    function prevPage() {
        setPage(page - 1)
    }
    function nextPage() {
        setPage(page + 1)
    }

    function closeModal() {
        ;(document.getElementById("onboardingModal") as HTMLInputElement).checked = false
    }
    return (
        <>
            <input
                defaultChecked
                type="checkbox"
                id="onboardingModal"
                className="modal-toggle hidden"
            />

            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    {page === 1 && (
                        <div className={"p-4"}>
                            <h2 className="text-2xl font-bold text-center text-gray-800 mt-0 mb-3">
                                {t(k.WELCOME_TO_AI_PROMPT_GENIUS)}
                            </h2>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">
                                {t(k.SELECT_LANG)}
                            </h4>
                            <LanguageSelect />
                            <Head4>{t(k.GET_STARTED_WITH_THIS_VIDEO)}</Head4>
                            <iframe
                                width="470"
                                height="281"
                                src="https://www.youtube-nocookie.com/embed/R9m3wWOlIAY?si=2q2weUV9dP3guoh1"
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}

                    {page === 2 && (
                        <div className={"p-4"} id="sync-choice-page">
                            <SyncChoice />
                        </div>
                    )}

                    {page === 3 && (
                        <div className={"p-4"}>
                            <Head2>{t(k.NEXT_STEPS)}</Head2>
                            <ShortcutInfo />
                            <Head4>{t(k.SETUP_CLOUD_SYNCING_EXPLORE)}</Head4>
                            <p>{t(k.WANT_TO_SYNC_YOUR_PROMPTS_ACRO)}</p>
                            <Head4>{t(k.CREATE_YOUR_FIRST_PROMPT_AND_F)}</Head4>
                            <p>{t(k.CLOSE_THIS_POPUP_WINDOW_AND_CL)}</p>
                        </div>
                    )}

                    <div className={"absolute bottom-0 mb-2 p-3"}>
                        <button
                            disabled={page === 1}
                            className={"btn mr-3 disabled:hidden"}
                            onClick={prevPage}
                        >
                            {t(k.BACK)}
                        </button>
                        <button
                            disabled={page === MAX_PAGE_NUM}
                            className={"btn disabled:hidden"}
                            onClick={nextPage}
                        >
                            {t(k.NEXT)}
                        </button>
                        <button
                            disabled={page !== MAX_PAGE_NUM}
                            className={"btn disabled:hidden"}
                            onClick={closeModal}
                        >
                            {t(k.CLOSE)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OnboardingModal
