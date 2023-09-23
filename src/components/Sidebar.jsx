import Logo from "./Logo.jsx"
import Folder from "./Folder.jsx"
import FolderModal from "./FolderModal.jsx";
import {newBlankPrompt} from "./js/utils.js";
import {HomeIcon, PlusDoc, PlusFolder} from "./icons/Icons.jsx";
import {useState} from "react";

export default function Sidebar({setPrompts, setFolders, folders}) {
    const [folderModal, setFolderModal] = useState(false)

    function newPrompt(){
        setPrompts(newBlankPrompt())
        setTimeout(() => document.querySelector(".edit").click(), 50)
    }

    function openFolderModal(){
        setFolderModal(true)
    }

    return (
        <>
            <div className="z-30 flex w-[230px] mr-[25px] flex-col overflow-hidden h-full">
                <div className="flex flex-col justify-between h-full border-r border-base-200 bg-base-200">
                <div className="flex grow flex-col overflow-y-auto">
                    <Logo />
                    <ul id="folderList" className="menu p-4 text-base-content sticky">
                        {/* Sidebar content here */}
                        <li className="selected folder" data-folder-name="all" id="all">
                            <a>
                                <HomeIcon></HomeIcon>
                                All Prompts
                            </a>
                        </li>
                        {folders.map((folder) => (
                            <Folder key={folder.id} folder={folder}></Folder>
                        ))}
                    </ul>
                </div>
                <ul className="menu p-3 text-base-content flex flex-col border-t-2 border-base-300">
                    <li><a onClick={newPrompt}><PlusDoc/> New Prompt</a></li>
                    <li><a onClick={openFolderModal}><PlusFolder/> New Folder</a></li>
                </ul>
                </div>
            </div>

            {folderModal && <FolderModal setFolders={setFolders} onClose={() => setFolderModal(false)} />}
        </>
    );
}