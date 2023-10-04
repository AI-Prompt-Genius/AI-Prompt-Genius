import React, { useState } from "react";

export default function SettingsModal(){
    const [currentPage, setCurrentPage] = useState("General");

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <>
            <input defaultChecked type="checkbox" id="settings-modal" className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box max-w-[1000px]">
                        <div className="flex flex-col h-full">
                            <div className="flex-grow overflow-auto">
                                <ul className="tabs w-full flex justify-between">
                                    <a onClick={() => handlePageChange('General')} className={`p-2 grow tab tab-lifted ${currentPage === "General" ? "tab-active" : ""}`}>General Settings</a>
                                    <a onClick={() => handlePageChange('Folders')} className={`p-2 grow tab tab-lifted ${currentPage === "Folders" ? "tab-active" : ""}`}>Manage Folders</a>
                                    <a onClick={() => handlePageChange('Export')} className={`p-2 grow tab tab-lifted ${currentPage === "Export" ? "tab-active" : ""}`}>Export</a>
                                    <a onClick={() => handlePageChange('Cloud')} className={`p-2 grow tab tab-lifted ${currentPage === "Cloud" ? "tab-active" : ""}`}>Cloud Syncing</a>
                                </ul>
                            </div>

                            {currentPage === "Export"}
                        </div>
                </div>
            </div>
        </>
    );
};
