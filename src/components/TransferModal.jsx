import React, {useState} from "react";
import k from "../i18n/keys.js";
import {useTranslation} from "react-i18next";
import Logo from "./Logo.jsx";
import LanguageSelect from "./LanguageSelect.jsx";

function TransferModal(){
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(1)
    const MAX_PAGE_NUM = 3


    function nextPage(){
        setPage(page + 1)
    }

    function prevPage(){
        setPage(page - 1)
    }


    return (
        <>
            <input defaultChecked type="checkbox" id="settings-modal" className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box max-w-[1000px] h-full">
                    <Logo className="w-20 h-20 mx-auto my-4"> </Logo>
                    {page === 1 &&
                        <div className={"mb-4"}>
                                <h2 className="text-2xl font-bold text-center text-gray-800 mt-6 mb-3">
                                    Welcome to the new AI Prompt Genius
                                </h2>
                                <p className="text-center text-xl text-gray-600 mb-4">
                                    Prompt Genius just got an update
                                </p>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Select a language to continue</h4>
                            <LanguageSelect />

                        </div>
                    }
                    {page === 2 &&
                        <div className="p-4">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">What's new?</h2>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Categories are now folders</h4>
                            <p className="text-gray-600 mb-4">You now get to pick your own categories - now called folders.</p>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Use AI Prompt Genius anywhere</h4>
                            <p className="text-gray-600 mb-4">AI Prompt Genius is now self-contained.
                                You can access it anywhere by clicking the
                                extension icon or opening the sidebar (Chrome 116+). Work with any AI model of your choice.</p>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">More robust import and cloud syncing features</h4>
                            <p>You can mass import prompts using a CSV template. Cloud syncing is now more reliable and prominent.</p>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">New sleek UI</h4>
                            <p>The new UI is more cohesive and modern.</p>
                            <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">History, themes, and chat export are being retired</h4>
                            <p className={"text-gray-600 mb-4"}>You can download a copy of your data <span className={"link"}> JSON here.</span></p>
                        </div>
                    }
                    {page === 3 &&
                        <div className="p-4">
                            <div className={"flex align-middle"}>
                                <h4 className="text-lg font-medium text-gray-700 mt-3 mb-3 mr-3">Import categories as</h4>
                                <select className={"select select-bordered"}>
                                    <option selected>None</option>
                                    <option>Folder</option>
                                    <option>Tag</option>
                                </select>
                            </div>
                            <p>If you want to continue using the legacy categories, you can choose to import them as tags or folders.</p>

                        </div>
                    }
                    <div className={"absolute bottom-0 mb-2 p-3"}>
                        <button disabled={page === 1} className={"btn mr-3 disabled:hidden"} onClick={prevPage}>Back</button>
                        <button disabled={page === MAX_PAGE_NUM} className={"btn disabled:hidden"} onClick={nextPage}>Next</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TransferModal