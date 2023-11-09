import React, {useState} from "react";
import k from "../i18n/keys.js";
import {useTranslation} from "react-i18next";

function TransferModal(){
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(1)
    const MAX_PAGE_NUM = 2


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
                    {page === 1 &&
                        <div>
                            <h2>Welcome to the new AI Prompt Genius</h2>
                            <p>Prompt Genius just got an update</p>
                            <hr />
                            <div>
                                Already enabled cloud syncing on another device? Just sign in with Google.
                            </div>
                            <button className={"btn"}>Sign In</button>
                        </div>
                    }
                    {page === 2 &&
                        <div>
                            <h2>What's new?</h2>
                            <h4>Categories are now folders</h4>
                            <p>You now get to pick your own categories - now called folders.</p>
                            <h4>Use prompt genius anywhere</h4>
                            <p>AI Prompt Genius is now self-contained outside of </p>
                        </div>
                    }
                    <button disabled={page === 1} className={"btn"} onClick={prevPage}>Back</button>
                    <button disabled={page === MAX_PAGE_NUM} className={"btn"} onClick={nextPage}>Next</button>
                </div>
            </div>
        </>
    )
}

export default TransferModal