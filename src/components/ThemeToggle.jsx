// ThemeToggle.js
import React from "react"
import { ThemeContext } from "./ThemeContext.jsx"
import { MoonIcon, SunIcon } from "./icons/Icons.jsx"
export default function ThemeToggle() {
    const { theme, switchTheme } = React.useContext(ThemeContext)

    return (
        <label className="cursor-pointer grid place-items-center ml-1">
            <input
                id="theme-toggle"
                onChange={switchTheme}
                checked={theme === "night"}
                type="checkbox"
                value="synthwave"
                className="toggle theme-controller bg-base-content row-start-1 col-start-1 col-span-2"
            />
            <SunIcon />
            <MoonIcon />
        </label>
    )
}
