import i18n from "i18next"
import k from "./../i18n/keys"
import ThemeToggle from "./ThemeToggle"
import Template from "./Template"
import PromptGrid from "./PromptGrid"
import { copyTextToClipboard, findVariables, replaceVariables } from "./js/utils"
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

    const [modalVisible, setModalVisible] = useState(false)
    const [variables, setVariables] = useState<string[]>([])
    const [promptText, setPromptText] = useState("")
    const [textareaValues, setTextareaValues] = useState<string[]>(Array(variables.length).fill(""))
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

    function getVarsFromModal(vars: string[], text: string) {
        setVariables(vars)
        setPromptText(text)
        setModalVisible(true)
    }

    function closeModal() {
        ;(document.getElementById("var_modal") as HTMLInputElement).checked = false
        setTimeout(() => setModalVisible(false), 100) // to allow for cool animation
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

    function usePrompt(text: string | undefined, varsFilledIn = true) {
        const vars = varsFilledIn ? findVariables(text ?? "") : [] // so if the chosen prompt has a variable within {{}}
        if (vars.length > 0) {
            getVarsFromModal(vars, text ?? "")
            return ""
        }
        if (text == undefined) {
            showToast(t(k.NO_PROMPT_TEXT))
            return
        }
        /* ReactGA.event({
            category: "Prompt Action",
            action: "Prompt Copied",
            nonInteraction: false, // optional, true/false
            transport: "xhr", // optional, beacon/xhr/image
        }) */
        setVariables([])
        const persist = localStorage.getItem("persist_variables") === "true"
        if (!persist) {
            setTextareaValues(Array(variables.length).fill(""))
        }
        copyTextToClipboard(text)
        showToast(t(k.PROMPT_COPIED))
    }

    const modalRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (modalVisible && e.key === "Enter") {
                // Check if Enter key is pressed
                e.preventDefault() // Prevent the default Enter behavior (e.g., form submission)
                usePrompt(replaceVariables(promptText, textareaValues), false)
                closeModal()
            }
        }

        const modalContainer = modalRef.current

        if (modalContainer) {
            modalContainer.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            if (modalContainer) {
                modalContainer.removeEventListener("keydown", handleKeyDown)
            }
        }
    }, [modalVisible, textareaValues])

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

            {modalVisible && (
                <>
                    <input
                        defaultChecked
                        type="checkbox"
                        id="var_modal"
                        className="modal-toggle hidden"
                    />

                    <div className="modal" ref={modalRef}>
                        <div className="modal-box">
                            {variables.map((variable, index) => (
                                <div key={index}>
                                    <div className="text-sm font-bold py-3">{variable}</div>
                                    <textarea
                                        autoFocus={index === 0}
                                        className="textarea textarea-bordered w-full h-[25px]"
                                        placeholder={`${t(k.ENTER_VALUE_FOR)} ${variable}${t(k._)}`}
                                        value={textareaValues[index]} // Use value instead of defaultValue
                                        onChange={e => {
                                            const newValues = [...textareaValues]
                                            newValues[index] = e.target.value
                                            console.log(newValues[index])
                                            setTextareaValues(newValues)
                                        }}
                                    ></textarea>
                                </div>
                            ))}

                            <div className="modal-action">
                                {localStorage.getItem("persist_variables") === "true" && (
                                    <div>
                                        <button
                                            className={"btn"}
                                            onClick={() => {
                                                console.log("clearing!")
                                                setTextareaValues(Array(variables.length).fill(""))
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        usePrompt(
                                            replaceVariables(promptText, textareaValues),
                                            false,
                                        )
                                        closeModal()
                                    }}
                                    id="save-vars"
                                    className="btn"
                                >
                                    {t(k.COPY)}
                                </button>
                            </div>
                        </div>
                        <div className="modal-backdrop">
                            <button onClick={closeModal}>{t(k.CLOSE)}</button>
                        </div>
                    </div>
                </>
            )}

            {showToastMessage && <Toast message={toastMessage} />}

            <ProUpgradeModal showToast={showToast} />
        </>
    )
}
