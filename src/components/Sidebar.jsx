import Logo from "./Logo.jsx"
import Folder from "./Folder.jsx"
import FolderModal from "./FolderModal.jsx";
import {getCurrentTimestamp, newBlankPrompt, newFilteredPrompt, uuid} from "./js/utils.js";
import {ArrowNewWindow, HomeIcon, PlusDoc, PlusFolder} from "./icons/Icons.jsx";
import {useState} from "react";

export default function Sidebar({setPrompts, setFolders, folders, filteredPrompts, filterPrompts, setFilteredPrompts, setSelectedFolder, selectedFolder, filterTags}) {
    const [folderModal, setFolderModal] = useState(false)

    function newPrompt(){
        const folder = selectedFolder
        const promptObj = {title:"", text:"", tags:[], folder, id: uuid(), lastEdited: getCurrentTimestamp()}
        setPrompts(newBlankPrompt(promptObj))
        setFilteredPrompts(newFilteredPrompt(promptObj, filteredPrompts))
        setTimeout(() => {const btn = document.querySelector(".edit").click(); if (btn) btn.click()}, 50)
    }


    const urlParams = new URLSearchParams(window.location.search);
    const isFullScreen = urlParams.get('fullscreen') === "true";

    function openFolderModal(){
        setFolderModal(true)
    }

    function closeFolderModal(){
        setFolderModal(false)
    }

    function selectFolder(id){
        setSelectedFolder(id)
        filterPrompts(id, filterTags)
        document.querySelectorAll(".folder").forEach(folder => {
            folder.classList.remove("selected")
        })
        document.getElementById(`folder-${id}`).classList.add("selected")
    }

    function openFullscreen() {
        // Create the message object
        var message = {
            message: "openFullScreen"
        };

        // Stringify the object to send via postMessage
        var messageString = JSON.stringify(message);

        // Send the message to the parent window
        window.parent.postMessage(messageString, "*");
    }

    return (
        <>
            <div className="z-30 flex w-[230px] mr-[25px] flex-col overflow-hidden h-full">
                <div className="flex flex-col justify-between h-full border-r border-base-200 bg-base-200">
                <div className="flex grow flex-col overflow-y-auto">
                    <Logo />
                    <ul id="folderList" className="menu p-4 text-base-content sticky">
                        {/* Sidebar content here */}
                        <li className="selected folder" data-folder-name="all" id="folder-">
                            <a onClick={() => selectFolder("")}>
                                <HomeIcon></HomeIcon>
                                All Prompts
                            </a>
                        </li>
                        {folders.map((folder) => (
                            <Folder id={`folder-${folder.id}`}
                                    key={folder.id}
                                    folder={folder}
                                    onClick={() => selectFolder(folder.id)}>
                            </Folder>
                        ))}
                    </ul>
                </div>
                <ul className="menu p-3 text-base-content flex flex-col border-t-2 border-base-300">
                    {!isFullScreen && <li><a onClick={openFullscreen}> <ArrowNewWindow /> Open Fullscreen</a></li>}
                    <li><a onClick={newPrompt}><PlusDoc/> New Prompt</a></li>
                    <li><a onClick={openFolderModal}><PlusFolder/> New Folder</a></li>
                </ul>
                </div>
            </div>

            {folderModal && <FolderModal setFolders={setFolders} onClose={closeFolderModal} />}
        </>
    );
}