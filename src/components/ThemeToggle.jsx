import React from "react"
import { ThemeContext } from "./ThemeContext.jsx"
import { CarrotDownIcon, CrownIcon, MoonIcon, SunIcon } from "./icons/Icons.jsx"
export default function ThemeToggle() {
    const { theme, switchTheme } = React.useContext(ThemeContext)

    // Handler function to switch theme
    const handleThemeChange = themeValue => {
        switchTheme(themeValue)
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost m-1">
                Theme <CarrotDownIcon />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content z-[100] menu p-2 shadow-2xl bg-base-300 rounded-box w-52"
            >
                <li>
                    <a onClick={() => handleThemeChange("winter")}>Default</a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("night")}>
                        Dark <MoonIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("retro")}>
                        Retro <CrownIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("cyberpunk")}>
                        Cyberpunk <CrownIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("valentine")}>
                        Valentine <CrownIcon />
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("aqua")}>
                        Aqua <CrownIcon />
                    </a>
                </li>
            </ul>
        </div>
    )
}
