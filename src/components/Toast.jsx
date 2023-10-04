import { useState, useEffect } from "react";
import {CheckIcon} from "./icons/Icons.jsx";

function Toast({ message }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const toastTimer = setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => {
            clearTimeout(toastTimer);
        };
    }, []);

    return (
        <div className={`toast bordernone z-1000 ${visible ? "show" : "hide"}`}>
            <div className="alert bg-accent text-[#ffffff]">
                <CheckIcon></CheckIcon>
                <span>{message}</span>
            </div>
        </div>
    );
}

export default Toast;
