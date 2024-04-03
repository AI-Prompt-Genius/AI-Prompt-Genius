import Head2 from "./Head2.jsx"
import Head4 from "./Head4.jsx"
import {activateLicense, getProStatus} from "./js/pro.js";
import {useState} from "react";

export function ActivatePro(props) {
    const [isPro, setPro] = useState(getProStatus());

    async function activatePro(){
        const key = document.getElementById("licenseKey").value;
        const success = await activateLicense(key);
        if (success){
            props.showToast("Successfully Activated Pro!")
            document.getElementById("licenseKey").disabled = true
            setPro(true)
        }
        else {
            props.showToast("Error activating pro. Make sure your license key is accurate")
        }
    }

    return (
        <div className={"px-4"}>
            <Head2>Activate Pro License</Head2>
            {!props.in_settings && <p>You can also activate your license anytime in settings</p>}
            <div className="join my-2">
                <input id={"licenseKey"} className={`input input-bordered join-item ${isPro ? "input-disabled" : ""}`} placeholder="License Key" />
                <button className={`btn btn-outline border-width-[1px] join-item ${isPro ? "btn-disabled" : ""}`} onClick={activatePro}>Activate</button>
            </div>
        </div>
    )
}
