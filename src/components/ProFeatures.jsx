import Head2 from "./Head2.jsx";
import Head4 from "./Head4.jsx";
import React from "react";

export function ProFeatures(props){
    return (
        <div className={"p-4"}>
            <Head2>Liked that theme? Upgrade to Pro!</Head2>
            <Head4>Features:</Head4>
            <ul className={"list-disc ml-6"}>
                <li>No ads! Removes bimonthly popup windows & text ads.</li>
                <li>
                    Get access to new themes, including cyberpunk, luxury, and more!
                </li>
                <li>Support a small developer</li>
            </ul>
            <a
                href={"https://link.aipromptgenius.app/upgrade-pro"}
                target={"_blank"}
                className={"btn btn-outline my-3"}
            >
                BUY A PRO LICENSE
            </a>
        </div>
    )
}