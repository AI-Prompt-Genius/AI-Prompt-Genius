import i18n from "i18next"
import k from "./../i18n/keys"
import ThemeToggle from "./ThemeToggle.jsx"
import Template from "./Template.jsx"
import { copyTextToClipboard, findVariables, replaceVariables } from "./js/utils.js"
import { useEffect, useRef, useState } from "react"
import Toast from "./Toast"
import CompactToggle from "./CompactToggle.jsx"
import { useLocalStorage } from "@uidotdev/usehooks"
import Ad from "./Ad.jsx"
import ReactGA from "react-ga4"
import { ProUpgradeModal } from "./ProUpgradeModal.jsx"
import { updateProStatus } from "./js/pro.js"

export default function MainContent({
    prompts,
    setPrompts,
    categories,
    folders,
    filteredPrompts,
    setFilteredPrompts,
    filterTags,
    setFilterTags,
    filterPrompts,
    setSelectedFolder,
    selectedFolder,
    setSearchTerm,
    searchTerm,
}) {
    const t = i18n.t

    const [modalVisible, setModalVisible] = useState(false)
    const [variables, setVariables] = useState([])
    const [promptText, setPromptText] = useState("")
    const [textareaValues, setTextareaValues] = useState(Array(variables.length).fill(""))
    const [compact, setCompact] = useLocalStorage("compact", false)

    const [showToastMessage, setShowToastMessage] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    const searchInputRef = useRef()

    const currentTime = new Date().getTime()
    const lastCheckedPro = localStorage.getItem("last_checked_pro") ?? currentTime
    const hasBeen24Hours = currentTime - lastCheckedPro > 24 * 60 * 60 * 1000

    if (hasBeen24Hours) {
        updateProStatus()
    }

    function getVarsFromModal(vars, text) {
        setVariables(vars)
        setPromptText(text)
        setModalVisible(true)
    }

    function closeModal() {
        document.getElementById("var_modal").checked = false
        setTimeout(() => setModalVisible(false), 100) // to allow for cool animation
    }

    function showToast(message) {
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

    function usePrompt(text, varsFilledIn = true) {
        const vars = varsFilledIn ? findVariables(text) : [] // so if the chosen prompt has a variable within {{}}
        if (vars.length > 0) {
            getVarsFromModal(vars, text)
            return ""
        }
        if (text == undefined) {
            showToast(t(k.NO_PROMPT_TEXT))
            return
        }
        ReactGA.event({
            category: "Prompt Action",
            action: "Prompt Copied",
            nonInteraction: false, // optional, true/false
            transport: "xhr", // optional, beacon/xhr/image
        })
        copyTextToClipboard(text)
        setVariables([])
        showToast(t(k.PROMPT_COPIED))
    }

    const modalRef = useRef(null)

    useEffect(() => {
        function handleKeyDown(event) {
            // 75 is the key code for 'k'
            if (event.keyCode === 75 && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                searchInputRef.current.focus()
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        // Clean up the event listener on unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = e => {
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
            <div className="flex flex-col w-full max-[500px]:w-full max-[500px]:ml-2">
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
                    <div className="h-full overflow-y-auto">
                        <div className={"flex p-4 pt-0 mx-3"}>
                            <Ad />
                        </div>
                        <ul
                            className="lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-3 flex flex-col z-0 mx-4 max-[500px]:mx-2 max-[500px]:mb-28"
                            id="templates"
                        >
                            {filteredPrompts.map(prompt => (
                                <Template
                                    setPrompts={setPrompts}
                                    filteredPrompts={filteredPrompts}
                                    setFilteredPrompts={setFilteredPrompts}
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
                            ))}
                        </ul>
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
                                            setTextareaValues(newValues)
                                        }}
                                    ></textarea>
                                </div>
                            ))}
                            <div className="modal-action">
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
