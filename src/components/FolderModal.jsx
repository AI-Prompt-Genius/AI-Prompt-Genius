import {useState} from "react";
import {newFolder, uuid} from "./js/utils.js";

// eslint-disable-next-line react/prop-types
export default function FolderModal({onClose, setFolders}){
    const [folderVal, setFolderVal] = useState("")
    const id = uuid()

    function closeModal() {
        document.getElementById(id).checked = false;
        setTimeout(() => onClose(), 100); // to allow for cool animation
    }

    function saveFolder(){
        setFolders(newFolder(folderVal))
        closeModal()
    }

    return (
        <div className="folder-modal-wrapper">
            <input defaultChecked type="checkbox" id={id} className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box">
                    <div>
                        <div className="text-sm font-bold py-3">
                            Folder Name
                        </div>
                    </div>
                    <input
                        autoFocus
                        maxLength="20"
                        className="textarea textarea-bordered w-full h-[25px]"
                        value={folderVal}
                        placeholder={"folder name"}
                        onChange={(e) => {
                            setFolderVal(e.target.value)
                        }}
                        ></input>
                    <div className="modal-action">
                        <button onClick={saveFolder} className="btn">
                            Save
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop">
                    <button onClick={closeModal}>Close</button>
                </div>
            </div>
        </div>
    )
}