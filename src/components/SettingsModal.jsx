import React, { useState } from "react";
import {exportCsv, exportJson, downloadCSVTemplate, csvToJson, combineJSONArrays} from "./js/export.js";
import Toast from "./Toast.jsx";
import {checkProperties, newFolder} from "./js/utils.js";

export default function SettingsModal({setSettingsVisible, setFilteredPrompts, setSelectedFolder, setFilterTags, setSearchTerm, setFolders}){
    const [currentPage, setCurrentPage] = useState("General");
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [settingsToast, setSettingsToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

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
            const newJSON = convertedJson.result;
            const newFolders = convertedJson.folders;
            console.log(newFolders)

            if (!checkProperties(newJSON[0], ["title", "content", "description", "folder", "tags", "id"])){
                showToast("Invalid CSV")
                return;
            }
            const oldFolders = JSON.parse(JSON.parse(localStorage.getItem("folders")))

            const combinedFolders = combineJSONArrays(newFolders, oldFolders)
            setFolders(combinedFolders)
            console.warn(combinedFolders)

            const currentPrompts = JSON.parse(JSON.parse((localStorage.getItem("prompts"))))
            const newPrompts = JSON.stringify(combineJSONArrays(newJSON, currentPrompts))
            localStorage.setItem("prompts", newPrompts)
            setFilteredPrompts(JSON.parse(JSON.parse(newPrompts)))
            clearFilters()
            showToast("Successfully imported prompts")
        };
        reader.onerror = function (event) {
            console.error(`Error occurred in file reader: `);
            console.error(event);
            showToast("Invalid File")
        };
        reader.readAsText(file);
    }

    function showToast(message){
        setSettingsToast(true)
        setToastMessage(message)
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

    return (
        <>
            <input defaultChecked type="checkbox" id="settings-modal" className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                        <div className="flex flex-col">
                            <div className="flex-grow overflow-hidden">
                                <ul className="tabs w-full flex justify-between">
                                    <a onClick={() => handlePageChange('General')} className={`p-2 grow tab tab-lifted ${currentPage === "General" ? "tab-active" : ""}`}>General Settings</a>
                                    <a onClick={() => handlePageChange('Folders')} className={`p-2 grow tab tab-lifted ${currentPage === "Folders" ? "tab-active" : ""}`}>Manage Folders</a>
                                    <a onClick={() => handlePageChange('Export')} className={`p-2 grow tab tab-lifted ${currentPage === "Export" ? "tab-active" : ""}`}>Import & Export</a>
                                    <a onClick={() => handlePageChange('Cloud')} className={`p-2 grow tab tab-lifted ${currentPage === "Cloud" ? "tab-active" : ""}`}>Cloud Syncing</a>
                                </ul>
                            </div>

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
                    <button onClick={closeModal}>Close</button>
                </div>
            </div>
            {settingsToast && <Toast message={toastMessage} /> }
        </>
    );
};
