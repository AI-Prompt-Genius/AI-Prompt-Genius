import { useState, useEffect } from "react";

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
        <div className={`toast ${visible ? "show" : "hide"}`}>
            <div className="alert bg-accent text-[#ffffff]">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                    />
                </svg>
                <span>{message}</span>
            </div>
        </div>
    );
}

export default Toast;
