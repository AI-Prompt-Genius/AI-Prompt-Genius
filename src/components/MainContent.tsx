import i18n from "i18next"
import k from "./../i18n/keys"
import ThemeToggle from "./ThemeToggle"
import Template from "./Template"
import PromptGrid from "./PromptGrid"
import { copyTextToClipboard } from "./js/utils"
import { hasVariables } from "./js/variables"
import VariableFillModal from "./VariableFillModal"
import { useEffect, useRef, useState } from "react"
import Toast from "./Toast"
import CompactToggle from "./CompactToggle"
import { useLocalStorage } from "@uidotdev/usehooks"
import Ad from "./Ad"
import ReactGA from "react-ga4"
import { ProUpgradeModal } from "./ProUpgradeModal"
import { updateProStatus } from "./js/pro"
import type { LegacyPrompt } from "../types"

interface MainContentProps {
    prompts: LegacyPrompt[]
    setPrompts: (...args: any[]) => void
    categories?: any
    tags?: any
    folders: string[]
    filteredPrompts: LegacyPrompt[]
    filterTags: string[]
    setFilterTags: (...args: any[]) => void
    filterPrompts: (folder?: string, tags?: string[], searchTerm?: string) => void
    setSelectedFolder: (...args: any[]) => void
    selectedFolder: string
    setSearchTerm: (...args: any[]) => void
    searchTerm: string
}

export default function MainContent({
    prompts,
    setPrompts,
    categories,
    folders,
    filteredPrompts,
    filterTags,
    setFilterTags,
    filterPrompts,
    setSelectedFolder,
    selectedFolder,
    setSearchTerm,
    searchTerm,
}: MainContentProps) {
    const t = i18n.t

    // The prompt whose variables are currently being filled in (null = modal closed).
    const [activePrompt, setActivePrompt] = useState<string | null>(null)
    const [compact, setCompact] = useLocalStorage("compact", false)

    const [showToastMessage, setShowToastMessage] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    const searchInputRef = useRef<HTMLInputElement>(null)

    const currentTime = new Date().getTime()
    const lastCheckedPro = Number(localStorage.getItem("last_checked_pro") ?? 0)
    const hasBeen24Hours = currentTime - lastCheckedPro > 24 * 60 * 60 * 1000

    if (hasBeen24Hours) {
        updateProStatus()
    }

    function closeModal() {
        const el = document.getElementById("var_modal") as HTMLInputElement | null
        if (el) el.checked = false
        setTimeout(() => setActivePrompt(null), 100) // to allow for cool animation
    }

    function showToast(message: string) {
        setShowToastMessage(true)
        setToastMessage(message)

        setTimeout(() => {
            setShowToastMessage(false)
            setToastMessage("")
        }, 3000)
    }

    function changeCompact() {
        setCompact(!compact)
    }

    // `openModal` distinguishes the initial click (parse & maybe open the fill-in form) from the
    // post-fill copy (text already resolved — copy straight to clipboard).
    function usePrompt(text: string | undefined, openModal = true) {
        if (text == undefined) {
            showToast(t(k.NO_PROMPT_TEXT))
            return
        }
        if (openModal && hasVariables(text)) {
            setActivePrompt(text)
            return
        }
        copyTextToClipboard(text)
        showToast(t(k.PROMPT_COPIED))
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            // 75 is the key code for 'k'
            if (event.keyCode === 75 && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                searchInputRef.current?.focus()
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        // Clean up the event listener on unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    return (
        <>
            <div className="flex flex-col h-full w-full max-[500px]:w-full max-[500px]:ml-2">
                <div className="sticky z-10 flex p-4 align-middle justify-center">
                    <div className="grow mr-3">
                        <div className="join w-full">
                            <input
                                type="text"
                                className="input w-full"
                                placeholder={t(k.SEARCH_PROMPTS)}
                                onChange={event => {
                                    setSearchTerm(event.target.value)
                                    filterPrompts(selectedFolder, filterTags, event.target.value)
                                }}
                                ref={searchInputRef}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center align-middle">
                        <CompactToggle compact={compact} changeCompact={changeCompact} />
                        <ThemeToggle />
                    </div>
                </div>

                {filteredPrompts && (
                    <div className="flex-1 min-h-0" id="templates">
                        <PromptGrid
                            prompts={filteredPrompts}
                            header={
                                <div className={"flex p-4 pt-0 mx-3"}>
                                    <Ad />
                                </div>
                            }
                            renderTemplate={prompt => (
                                <Template
                                    setPrompts={setPrompts}
                                    categories={categories}
                                    onClick={() => usePrompt(prompt.text)}
                                    template={prompt}
                                    key={prompt.id}
                                    folders={folders}
                                    filterTags={filterTags}
                                    setFilterTags={setFilterTags}
                                    filterPrompts={filterPrompts}
                                    selectedFolder={selectedFolder}
                                    searchTerm={searchTerm}
                                    compact={compact}
                                ></Template>
                            )}
                        />
                    </div>
                )}
            </div>

            {activePrompt !== null && (
                <VariableFillModal
                    promptText={activePrompt}
                    onClose={closeModal}
                    onSubmit={resolved => usePrompt(resolved, false)}
                />
            )}

            {showToastMessage && <Toast message={toastMessage} />}

            <ProUpgradeModal showToast={showToast} />
        </>
    )
}
