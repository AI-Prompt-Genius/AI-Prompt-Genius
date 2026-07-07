import "./App.css"
import Sidebar from "./components/Sidebar"
import MainContent from "./components/MainContent"
import TransferModal from "./components/TransferModal"
import React, { useEffect, useMemo, useState } from "react"
import { useDebounce } from "@uidotdev/usehooks"
import { ThemeContext } from "./components/ThemeContext"
import { checkForResync, finishAuth } from "./components/js/cloudSyncing"
import Toast from "./components/Toast"
import { getObject, sendMessageToParent, setObject } from "./components/js/utils"
import OnboardingModal from "./components/OnboardingModal"
import i18next from "i18next"
import HotkeyUpdateModal from "./components/HotkeyUpdateModal"
import ReactGA from "react-ga4"
import type { LegacyPrompt } from "./types"
import { usePromptStore } from "./store/usePromptStore"
import { migrateLegacyToIDB } from "./data/migrate"
import { initAuth } from "./auth/customAuth"
import { cloudSyncIfDue } from "./sync/syncClient"
import AuthModal from "./components/AuthModal"
import ManageAccountModal from "./components/ManageAccountModal"
import OptionSetsModal from "./components/OptionSetsModal"

function applyFilters(
    prompts: LegacyPrompt[],
    folder: string,
    tags: string[],
    searchTerm: string,
): LegacyPrompt[] {
    let newFiltered = prompts
    if (tags.length > 0) {
        // Check if all tags in the filterTags array are included in each prompt's tags array
        newFiltered = newFiltered.filter(prompt =>
            tags.every(filterTag => prompt.tags.includes(filterTag)),
        )
    }
    if (folder !== "") {
        newFiltered = newFiltered.filter(obj => obj.folder === folder)
    }
    if (searchTerm !== "") {
        const s = searchTerm.toLowerCase()
        newFiltered = newFiltered.filter(
            prompt =>
                prompt.text?.toLowerCase().includes(s) ||
                prompt.description?.toLowerCase().includes(s) ||
                prompt.title?.toLowerCase().includes(s),
        )
    }
    return newFiltered
}

function App() {
    const { theme } = React.useContext(ThemeContext)

    // Single source of truth (replaces useLocalStorage + the shadow `filteredPrompts` state).
    const prompts = usePromptStore(s => s.prompts)
    const folders = usePromptStore(s => s.folders)
    const setPrompts = usePromptStore(s => s.replacePrompts)
    const setFolders = usePromptStore(s => s.replaceFolders)
    const reloadFromLegacy = usePromptStore(s => s.reloadFromLegacy)

    const tags = useMemo(
        () => (prompts.length > 0 ? new Set(prompts.flatMap(obj => obj.tags)) : new Set<string>()),
        [prompts],
    )

    const [selectedFolder, setSelectedfolder] = useState("")
    const [filterTags, setFilterTags] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [toast, setToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    // Debounce only the text filter so typing stays responsive on large libraries; folder/tag
    // changes still apply immediately.
    const debouncedSearch = useDebounce(searchTerm, 150)

    // Derived, not stored — no more drift between `prompts` and `filteredPrompts`.
    const filteredPrompts = useMemo(
        () => applyFilters(prompts, selectedFolder, filterTags, debouncedSearch),
        [prompts, selectedFolder, filterTags, debouncedSearch],
    )

    // get the "transfer" and onboarding URL parameters
    const transferring = new URLSearchParams(window.location.search).get("transfer") ?? false
    const onboarding = new URLSearchParams(window.location.search).get("onboarding") ?? false

    // Hotkey Update Modal 12/13
    const lang = localStorage.getItem("lng") ?? "en"
    const seenHotkeyUpdate = true
    const showHotkeyUpdate = lang === "en" && !onboarding && !transferring && !seenHotkeyUpdate

    // Filtering is now just filter-state updates; the list is derived above.
    function filterPrompts(folder: string = "", tags: string[] = [], searchTerm: string = "") {
        setSelectedfolder(folder)
        setFilterTags(tags)
        setSearchTerm(searchTerm)
    }

    function pollLocalStorage() {
        const intervalId = setInterval(() => {
            const finishedAuthValue = localStorage.getItem("finishedAuthEvent")
            if (finishedAuthValue && finishedAuthValue !== "") {
                reloadFromLegacy()
                showToast(finishedAuthValue)
                localStorage.setItem("finishedAuthEvent", "")
                clearInterval(intervalId)
            }
        }, 1000) // Polls every 1000ms or 1 second
    }

    // One-time setup: analytics, IndexedDB migration, auth bootstrap, cloud resync.
    useEffect(() => {
        ReactGA.initialize("G-YV9PMGYJDJ")
        ReactGA.send({ hitType: "pageview", page: "/", title: "Home" })
        migrateLegacyToIDB()
        // Auth bootstrap: exchanges a Google ?code= callback if present, resumes a sign-in
        // handed over from the sidebar, then background-syncs if signed in.
        initAuth()
            .then(() => {
                window.dispatchEvent(new Event("auth-changed"))
                cloudSyncIfDue()
            })
            .catch(err => console.error("Auth bootstrap failed", err))
        if (getObject("cloudSyncing", false)) {
            checkForResync()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const handleMessage = async function (event: MessageEvent) {
            // The extension bridge always posts JSON strings; devtools/extensions/libraries post
            // objects — ignore anything that isn't ours instead of throwing.
            if (typeof event.data !== "string") return
            let data
            try {
                data = JSON.parse(event.data)
            } catch {
                return
            }
            if (data.message === "newAuthToken") {
                localStorage.setItem("GOOGLE_API_TOKEN", data.token)
                finishAuth()
                pollLocalStorage()
            } else if (data.message === "transfer") {
                await i18next.changeLanguage(data.lang)
                localStorage.setItem("lng", data.lang)
                setObject("transferPrompts", data.prompts)
                setObject("transferred", true)
            }
        }

        window.addEventListener("message", handleMessage)
        return () => window.removeEventListener("message", handleMessage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "prompts") {
                const value = event.newValue
                if (value) {
                    // Cross-tab change: refresh the mirror and pull the new data into the store.
                    sendMessageToParent({ message: "sync_prompts", data: JSON.parse(value) })
                    reloadFromLegacy()
                }
            }
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function showToast(message: string) {
        setToast(true)
        setToastMessage(message)
        setTimeout(() => {
            setToast(false)
            setToastMessage("")
        }, 3000)
    }

    return (
        <div data-theme={theme} className={`flex bg-base-100 w-[100vw] h-[100vh] overflow-hidden`}>
            <Sidebar
                filterPrompts={filterPrompts}
                setPrompts={setPrompts}
                setFolders={setFolders}
                folders={folders}
                setSelectedFolder={setSelectedfolder}
                selectedFolder={selectedFolder}
                setFilterTags={setFilterTags}
                filterTags={filterTags}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showToast={showToast}
            />

            <MainContent
                filteredPrompts={filteredPrompts}
                filterPrompts={filterPrompts}
                setPrompts={setPrompts}
                prompts={prompts}
                tags={tags}
                folders={folders}
                filterTags={filterTags}
                setFilterTags={setFilterTags}
                setSelectedFolder={setSelectedfolder}
                selectedFolder={selectedFolder}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            {toast && <Toast message={toastMessage} />}
            <AuthModal />
            <ManageAccountModal />
            <OptionSetsModal />
            {transferring && <TransferModal />}
            {onboarding && <OnboardingModal />}
            {showHotkeyUpdate && <HotkeyUpdateModal />}
        </div>
    )
}

export default App
