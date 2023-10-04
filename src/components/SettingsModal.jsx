import React, { useState } from "react";
import {exportCsv} from "./js/export.js";

export default function SettingsModal({setSettingsVisible}){
    const [currentPage, setCurrentPage] = useState("General");

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

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
                                    <a onClick={() => handlePageChange('Export')} className={`p-2 grow tab tab-lifted ${currentPage === "Export" ? "tab-active" : ""}`}>Export & Delete</a>
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
                                            <button className="btn"> Export JSON </button>
                                        </div>
                                    </div>
                                    <div className="card mt-3 mb-3">
                                        <div className="card-body pt-0">
                                            <h5 className="card-title">Danger Zone - Mass Delete</h5>
                                            <p>Mass delete your prompts and threads. We recommend exporting first.</p>
                                            <button className="btn bg-warning"> Delete All Prompts </button>
                                            <button className="btn bg-warning"> Delete All History </button>
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
        </>
    );
};
