// ThemeToggle.js
import React from "react";
import {ThemeContext} from "./ThemeContext.jsx";
import {MoonIcon, SunIcon} from "./icons/Icons.jsx";
export default function ThemeToggle() {
    const { theme, switchTheme } = React.useContext(ThemeContext);

    return (
        <div className="flex flex-col justify-center align-middle">
            <div className="m-4 inline-grid grid-cols-2">
                <SunIcon></SunIcon>
                <MoonIcon></MoonIcon>
                <label htmlFor="theme-toggle" />
                <input
                    id="theme-toggle"
                    type="checkbox"
                    checked={theme === "night"}
                    className={`toggle bg-transparent col-start-1 row-start-1 col-span-2 [--b1:219_14%_80%] checked:[--b1:215_28%_17%] ${theme}`}
                    onChange={switchTheme}
                />
            </div>
        </div>
    );
}