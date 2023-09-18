import Logo from "./Logo.jsx"
import Folder from "./Folder.jsx"
import {newBlankPrompt} from "./js/utils.js";

export default function Sidebar(props) {
    let folders = props.folders;

    function newPrompt(){
        props.setPrompts(newBlankPrompt())
        document.querySelector(".edit").click()
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
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                              />
                            </svg>
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