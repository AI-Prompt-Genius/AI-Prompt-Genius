import React from "react"
import { ThemeContext } from "./ThemeContext.jsx"
import { CarrotDownIcon, MoonIcon, SunIcon } from "./icons/Icons.jsx"
export default function ThemeToggle() {
    const { theme, switchTheme } = React.useContext(ThemeContext)

    return (
        <div className="dropdown">
            <div tabIndex={0} role="button" className="btn m-1">
                Theme
                <CarrotDownIcon />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content z-[100] p-2 shadow-2xl bg-base-300 rounded-box w-52"
            >
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Default"
                        value="winter"
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Night"
                        value="night"
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Retro"
                        value="retro"
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Cyberpunk"
                        value="cyberpunk"
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Valentine"
                        value="valentine"
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Aqua"
                        value="aqua"
                    />
                </li>
            </ul>
        </div>
    )
}
