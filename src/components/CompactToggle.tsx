import React from "react"
import { ContractIcon, ExpandIcon } from "./icons/Icons.jsx"
export default function CompactToggle({ compact, changeCompact }) {
    function flipCheck() {
        changeCompact()
    }

    return (
        <button className={`btn btn-outline border-base-100 p-2`} onClick={flipCheck}>
            <label className={`swap ${compact ? "swap-active" : ""} swap-rotate`}>
                <span className={"swap-on"}>
                    <ExpandIcon />{" "}
                </span>
                <span className={"swap-off"}>
                    <ContractIcon />{" "}
                </span>
            </label>
        </button>
    )
}
