import Logo from "./Logo.jsx"
import Folder from "./Folder.jsx"
import {newBlankPrompt} from "./js/utils.js";
import {HomeIcon} from "./icons/Icons.jsx";

export default function Sidebar(props) {
    let folders = props.folders;

    function newPrompt(){
        props.setPrompts(newBlankPrompt())
        setTimeout(() => document.querySelector(".edit").click(), 50)
    }

    return (
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
            <div className="flex flex-col border-t-2 border-base-400">
                <button onClick={newPrompt} className="btn">New Prompt</button>
            </div>
            </div>
        </div>
    );
}