import React, { useState } from "react";
import {
    exportCsv,
    exportJson,
    downloadCSVTemplate,
    csvToJson,
    combineJSONArrays,
    removeDuplicatesByName, getDuplicateFolders, sanitizeNewPrompts
} from "./js/export.js";
import Toast from "./Toast.jsx";
import {checkProperties, newFolder, removeFolder, removeFolderFromPrompts} from "./js/utils.js";
import LanguageSelect from "./LanguageSelect.jsx";
import {TrashIcon} from "./icons/Icons.jsx";

export default function SettingsModal({setSettingsVisible, setFilteredPrompts, setSelectedFolder, setFilterTags, setSearchTerm, folders, setFolders, showToast, setPrompts}){
    const [currentPage, setCurrentPage] = useState("General");
    const [confirmDelete, setConfirmDelete] = useState(false)

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    function showConfirm(){
        setConfirmDelete(true)
    }

    function downloadTemplate(){
        downloadCSVTemplate()
    }

    function clearFilters(){
        setSelectedFolder("")
        setFilterTags([])
        setSearchTerm("")
    }

    function importAny() {
        let input = document.querySelector("#import");
        let file = input.files[0];
        if (!file) {
            console.warn(`unable to find a valid file`);
            showToast("File not found")
            return;
        }

        let reader = new FileReader();
        reader.onload = function (event) {
            const string = event.target.result;
            const convertedJson = csvToJson(string)
            let newPrompts = convertedJson.result;
            let newFolders = convertedJson.folders;

            if (!checkProperties(newPrompts[0], ["title", "content", "description", "folder", "tags", "id"])){
                showToast("Invalid CSV - Match Template")
                return;
            }
            let oldFolders = JSON.parse(JSON.parse(localStorage.getItem("folders")))
            const duplicateFolders = getDuplicateFolders(oldFolders, newFolders)
            newFolders = removeDuplicatesByName(oldFolders, newFolders, "name")

            const combinedFolders = combineJSONArrays(newFolders, oldFolders) // removes folders with duplicate title
            setFolders(combinedFolders)

            newPrompts = sanitizeNewPrompts(newPrompts, duplicateFolders);

            let currentPrompts = JSON.parse(JSON.parse((localStorage.getItem("prompts"))))
            currentPrompts = removeDuplicatesByName(newPrompts, currentPrompts)
            const combinedPrompts = JSON.stringify(combineJSONArrays(newPrompts, currentPrompts))
            localStorage.setItem("prompts", combinedPrompts)
            setFilteredPrompts(JSON.parse(JSON.parse(combinedPrompts)))
            clearFilters()
            showToast("Successfully imported prompts")
            document.querySelector("#close_modal").click()
        };
        reader.onerror = function (event) {
            console.error(`Error occurred in file reader: `);
            console.error(event);
            showToast("Invalid File")
        };
        reader.readAsText(file);
    }


    function openFileSelect(){
        document.getElementById("import").click()
    }

    function deletePrompts(){
        localStorage.removeItem("prompts")
        localStorage.removeItem("folders")
        setFilteredPrompts([])
        clearFilters()
        setConfirmDelete(false)
        showToast("Deleted All Prompts and Folders")
        location.reload()
    }

    function closeModal() {
        document.getElementById("settings-modal").checked = false;
        setTimeout(()=> setSettingsVisible(false), 100); // to allow for cool animation
    }

    function deleteFolder(id){
        setFolders(removeFolder(id))
        setPrompts(removeFolderFromPrompts(id))
    }

    return (
        <>
            <input defaultChecked type="checkbox" id="settings-modal" className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                        <div className="flex flex-col">
                            <div className="flex-grow overflow-hidden">
                                <ul className="tabs w-full flex justify-between">
                                    <a onClick={() => handlePageChange('General')} className={`p-2 grow tab tab-lifted ${currentPage === "General" ? "tab-active" : ""}`}>
                                        <div className={"pb-3"}>General Settings</div>
                                    </a>
                                    <a onClick={() => handlePageChange('Folders')} className={`p-2 grow tab tab-lifted ${currentPage === "Folders" ? "tab-active" : ""}`}>
                                        Manage Folders
                                    </a>
                                    <a onClick={() => handlePageChange('Export')} className={`p-2 grow tab tab-lifted ${currentPage === "Export" ? "tab-active" : ""}`}>
                                        Import & Export
                                    </a>
                                    <a onClick={() => handlePageChange('Cloud')} className={`p-2 grow tab tab-lifted ${currentPage === "Cloud" ? "tab-active" : ""}`}>
                                        Cloud Syncing
                                    </a>
                                </ul>
                            </div>

                            {currentPage === "General" &&
                                <div className="card mt-3 mb-3">
                                    <div className="card-body pt-2">
                                        <h5 className="card-title">Language</h5>
                                        <LanguageSelect />
                                    </div>
                                </div>
                            }

                            {currentPage === "Folders" && folders.length > 0 &&
                                <div className="card mt-3 mb-3">
                                    <div className="card-body pt-2">
                                        <h5 className="card-title">Delete Folders</h5>
                                        <table className="table w-full">
                                            <tbody>
                                                <tr className="justify-between">
                                                    <th>Folder Name</th>
                                                    <th className="w-16 text-center"><div className="my-1 disabled hover:bg-none border-none px-3 bg-inherit"><TrashIcon /></div></th>
                                                </tr>
                                                {folders.map((folder) =>
                                                    <tr key={folder.id}>
                                                        <td>{folder.name}</td>
                                                        <td><button onClick={() => deleteFolder(folder.id)} className="my-1 btn p-3 bg-inherit"><TrashIcon /></button></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            }

                            {currentPage === "Folders" && folders.length === 0 &&
                                <div className="card mt-3 mb-3">
                                    <div className="card-body pt-2">
                                        <h5 className="card-title">To get started, create a folder in the sidebar</h5>
                                    </div>
                                </div>
                            }

                            {currentPage === "Export" &&
                                <>
                                    <div className="card mt-3 mb-3">
                                        <div className="card-body pb-1 pt-1">
                                            <h2 className="card-title">Export Prompts</h2>
                                            <p>These files can be used to transfer your prompts somewhere else.</p>
                                            <button className="btn" onClick={() => exportCsv()}> Export CSV </button>
                                            <button className="btn" onClick={exportJson}> Export JSON </button>
                                        </div>
                                    </div>
                                    <div className="card mt-3 mb-3">
                                        <div className="card-body pb-1 pt-1">
                                            <h2 className="card-title">Import Prompts</h2>
                                            <p>Use this <a className="link link-primary" onClick={downloadTemplate}>CSV template</a> to import prompts.</p>
                                            <button className="m-2 btn" onClick={openFileSelect}>
                                                <label id="import-label" className="clickable" htmlFor="import-any">Import CSV</label>
                                                <input onChange={importAny} type="file" accept=".csv" id="import" className="hidden-trick"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card mt-3 mb-3">
                                        <div className="card-body pt-0">
                                            <h5 className="card-title">Danger Zone - Mass Delete</h5>
                                            <p>Mass delete your prompts and threads. We recommend exporting first.</p>
                                            <button className="btn" onClick={showConfirm}> Delete All Prompts & Folders </button>
                                            {confirmDelete && <button onClick={deletePrompts} className="btn bg-warning">Confirm Delete</button>}
                                        </div>
                                    </div>
                                </>
                            }
                        </div>
                </div>
                <div className="modal-backdrop">
                    <button id="close_modal" onClick={closeModal}>Close</button>
                </div>
            </div>
        </>
    );
};
