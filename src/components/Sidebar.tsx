import i18n from "i18next"
import k from "./../i18n/keys"
import Logo from "./Logo"
import Folder from "./Folder"
import FolderModal from "./FolderModal"
import { getCurrentTimestamp, getObject, MAX_PROMPTS, newBlankPrompt, uuid } from "./js/utils"
import {
    ArrowNewWindow,
    Cog,
    HomeIcon,
    PlusDoc,
    PlusFolder,
    SignOutIcon,
    UserIcon,
} from "./icons/Icons"
import React, { useEffect, useState } from "react"
import SettingsModal from "./SettingsModal"
import Toast from "./Toast"
import type { LegacyPrompt } from "../types"
import { isSignedIn, signOut } from "../auth/customAuth"
import { OPEN_AUTH_EVENT } from "./AuthModal"
import { OPEN_ACCOUNT_EVENT } from "./ManageAccountModal"

interface SidebarProps {
    setPrompts: (...args: any[]) => void
    setFolders: (...args: any[]) => void
    folders: string[]
    filterPrompts: (folder?: string, tags?: string[], searchTerm?: string) => void
    setSelectedFolder: (...args: any[]) => void
    selectedFolder: string
    filterTags: string[]
    setFilterTags: (...args: any[]) => void
    searchTerm: string
    setSearchTerm: (...args: any[]) => void
    showToast: (message: string) => void
}

export default function Sidebar({
    setPrompts,
    setFolders,
    folders,
    filterPrompts,
    setSelectedFolder,
    selectedFolder,
    filterTags,
    setFilterTags,
    searchTerm,
    setSearchTerm,
    showToast,
}: SidebarProps) {
    const t = i18n.t

    const [folderModal, setFolderModal] = useState(false)
    const [settingsModal, setSettingsModal] = useState(false)

    // Account state — sign-in may complete in another same-origin context (fullscreen tab), so
    // track both local writes (custom event) and cross-context writes (storage event).
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

    async function handleSignOut() {
        await signOut()
        setSignedIn(false)
        window.dispatchEvent(new Event("auth-changed"))
        showToast("Signed out — your prompts stay on this device")
    }

    function newPrompt() {
        if (getObject("prompts", []).length >= MAX_PROMPTS) {
            showToast(`You've reached the maximum of ${MAX_PROMPTS.toLocaleString()} prompts.`)
            return
        }
        const folder = selectedFolder
        const promptObj = {
            title: "",
            text: "",
            tags: [],
            folder,
            id: uuid(),
            lastChanged: getCurrentTimestamp(),
            description: "",
        }
        setPrompts(newBlankPrompt(promptObj))
        // The new card is index 0 in the virtualized grid — scroll to top so it's mounted, then
        // open ITS editor by id (a bare ".edit" query could hit whichever card happens to be
        // mounted first).
        const scroller = Array.from(document.querySelectorAll("#templates *")).find(
            el => getComputedStyle(el).overflowY === "auto",
        )
        if (scroller) scroller.scrollTop = 0
        setTimeout(() => {
            const btn = document
                .getElementById(promptObj.id)
                ?.querySelector(".edit") as HTMLElement | null
            btn?.click()
        }, 120)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const isFullScreen = urlParams.get("fullscreen") === "true"

    function openFolderModal() {
        setFolderModal(true)
    }

    function closeFolderModal() {
        setFolderModal(false)
    }

    function openSettings() {
        setSettingsModal(true)
    }

    function selectFolder(name: string) {
        setSelectedFolder(name)
        filterPrompts(name, filterTags, searchTerm)
        document.querySelectorAll(".folder").forEach(folder => {
            folder.classList.remove("selected")
        })
        document.getElementById(`folder-${name}`)?.classList.add("selected")
    }

    function openFullscreen() {
        console.log("OPENING!")
        // Create the message object
        var message = {
            message: "openFullScreen",
        }

        // Stringify the object to send via postMessage
        var messageString = JSON.stringify(message)

        // Send the message to the parent window
        window.parent.postMessage(messageString, "*")
    }

    return (
        <div>
            <div className="max-[400px]:hidden max-[600px]:w-[160px] z-30 flex w-[230px] flex-col overflow-hidden h-full">
                <div className="flex flex-col justify-between h-full border-r border-base-200 bg-base-200">
                    <div className="flex grow flex-col overflow-y-auto">
                        <Logo />
                        <ul id="folderList" className="menu p-4 text-base-content sticky">
                            {/* Sidebar content here */}
                            <li
                                key=""
                                className="selected folder"
                                data-folder-name="all"
                                id="folder-"
                            >
                                <a onClick={() => selectFolder("")}>
                                    <HomeIcon></HomeIcon>
                                    {t(k.ALL_PROMPTS)}
                                </a>
                            </li>
                            {folders.map((folder: string) => (
                                <Folder
                                    id={`${t(k.FOLDER)}${folder}`}
                                    key={folder}
                                    folder={folder}
                                    onClick={() => selectFolder(folder)}
                                ></Folder>
                            ))}
                        </ul>
                    </div>
                    <ul className="menu p-3 text-base-content flex flex-col border-t-2 border-base-300">
                        <li>
                            <a onClick={newPrompt}>
                                <PlusDoc /> {t(k.NEW_PROMPT)}
                            </a>
                        </li>
                        <li>
                            <a onClick={openFolderModal}>
                                <PlusFolder /> {t(k.NEW_FOLDER)}
                            </a>
                        </li>
                        {!isFullScreen && (
                            <li>
                                <a onClick={openFullscreen}>
                                    {" "}
                                    <ArrowNewWindow /> {t(k.OPEN_FULLSCREEN)}
                                </a>
                            </li>
                        )}

                        <li>
                            <a onClick={openSettings}>
                                <Cog /> {t(k.SETTINGS)}
                            </a>
                        </li>
                        {!signedIn && (
                            <li>
                                <a
                                    id="sidebar-signin"
                                    onClick={() => window.dispatchEvent(new Event(OPEN_AUTH_EVENT))}
                                >
                                    <UserIcon /> Sign in
                                </a>
                            </li>
                        )}
                        {signedIn && (
                            <>
                                <li>
                                    <a
                                        id="sidebar-account"
                                        onClick={() =>
                                            window.dispatchEvent(new Event(OPEN_ACCOUNT_EVENT))
                                        }
                                    >
                                        <UserIcon /> Manage account
                                    </a>
                                </li>
                                <li>
                                    <a id="sidebar-signout" onClick={handleSignOut}>
                                        <SignOutIcon /> Sign out
                                    </a>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
            <div className="min-[400px]:hidden menu menu-horizontal bg-base-200 opacity-100 z-10 w-full flex absolute bottom-0">
                <li className="w-1/2">
                    <a onClick={newPrompt}>
                        <PlusDoc /> {t(k.NEW_PROMPT)}
                    </a>
                </li>
                <li className="w-1/2">
                    <a onClick={openFullscreen}>
                        {" "}
                        <ArrowNewWindow /> {t(k.OPEN_FULLSCREEN)}
                    </a>
                </li>
            </div>
            {folderModal && <FolderModal setFolders={setFolders} onClose={closeFolderModal} />}

            {settingsModal && (
                <SettingsModal
                    setSettingsVisible={setSettingsModal}
                    setSelectedFolder={setSelectedFolder}
                    setFilterTags={setFilterTags}
                    setSearchTerm={setSearchTerm}
                    setFolders={setFolders}
                    showToast={showToast}
                    folders={folders}
                    setPrompts={setPrompts}
                    filterPrompts={filterPrompts}
                />
            )}
        </div>
    )
}
