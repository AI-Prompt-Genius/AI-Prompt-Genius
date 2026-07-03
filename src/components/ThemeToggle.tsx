import React from "react"
import { ThemeContext } from "./ThemeContext.jsx"
import { CarrotDownIcon, CrownIcon, MoonIcon, SunIcon } from "./icons/Icons.jsx"
import k from "../i18n/keys.js"
import { useTranslation } from "react-i18next"

export default function ThemeToggle() {
    const { theme, switchTheme } = React.useContext(ThemeContext)
    const { t } = useTranslation()

    // Handler function to switch theme
    const handleThemeChange = themeValue => {
        switchTheme(themeValue)
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost ml-2">
                {t(k.THEME)} <CarrotDownIcon />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content max-h-[65vh] overflow-y-auto flex-nowrap menu p-2 shadow-2xl bg-base-300 rounded-box w-52"
            >
                <li>
                    <a onClick={() => handleThemeChange("winter")}>{t(k.WINTER)}</a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("light")}>{t(k.LIGHT)}</a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("dark")}>
                        {t(k.DARK)} <MoonIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("night")}>
                        {t(k.NIGHT)} <MoonIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("cyberpunk")}>
                        {t(k.CYBERPUNK)} <CrownIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("retro")}>
                        {t(k.RETRO)} <CrownIcon />{" "}
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("valentine")}>
                        {t(k.VALENTINE)} <CrownIcon />
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("aqua")}>
                        {t(k.AQUA)} <CrownIcon />
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("nord")}>
                        {t(k.NORD)} <CrownIcon />
                    </a>
                </li>
                <li>
                    <a onClick={() => handleThemeChange("lemonade")}>
                        {t(k.LEMONADE)} <CrownIcon />
                    </a>
                </li>
                <li>
                    <a className={"flex"} onClick={() => handleThemeChange("forest")}>
                        {t(k.FOREST)} <MoonIcon /> <CrownIcon />
                    </a>
                </li>
                <li>
                    <a className={"flex"} onClick={() => handleThemeChange("luxury")}>
                        {t(k.LUXURY)} <MoonIcon /> <CrownIcon />
                    </a>
                </li>
            </ul>
        </div>
    )
}
