import React from "react"
import { ThemeContext } from "./ThemeContext.jsx"
import { CarrotDownIcon, MoonIcon, SunIcon } from "./icons/Icons.jsx"
export default function ThemeToggle() {
    const { theme, switchTheme } = React.useContext(ThemeContext)

    // Handler function to switch theme
    const handleChange = e => {
        switchTheme(e.target.value)
    }

    return (
        <div className="dropdown dropdown-end z-10">
            <div tabIndex={0} role="button" className="btn m-1 z-10">
                Theme
                <CarrotDownIcon />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content p-2 z-10 shadow-2xl bg-base-300 rounded-box w-fit"
            >
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Default"
                        value="light"
                        onChange={handleChange}
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Night"
                        value="night"
                        onChange={handleChange}
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Retro"
                        value="retro"
                        onChange={handleChange}
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Cyberpunk"
                        value="cyberpunk"
                        onChange={handleChange}
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Valentine"
                        value="valentine"
                        onChange={handleChange}
                    />
                </li>
                <li>
                    <input
                        type="radio"
                        name="theme-dropdown"
                        className="theme-controller z-[100] btn btn-sm btn-block btn-ghost justify-start"
                        aria-label="Aqua"
                        value="aqua"
                        onChange={handleChange}
                    />
                </li>
            </ul>
        </div>
    )
}
