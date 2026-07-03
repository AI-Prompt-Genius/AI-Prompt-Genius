import { createContext, useEffect } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"
import { getProStatus } from "./js/pro.js"

export const ThemeContext = createContext()

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useLocalStorage("theme", "winter")

    const freeThemes = ["winter", "light", "dark", "night"]

    useEffect(() => {
        setTheme(theme)
    }, [])

    async function handleThemeChange(newTheme) {
        if (freeThemes.includes(newTheme)) {
            setTheme(newTheme)
        } else {
            const proUser = getProStatus()
            if (proUser) {
                setTheme(newTheme)
            } else {
                // show pro modal
                let currentTheme = "winter"
                if (freeThemes.includes(theme)) {
                    currentTheme = theme // fixes weird double click hack
                }
                setTheme(newTheme)
                setTimeout(() => {
                    setTheme(currentTheme)
                    document.getElementById("proUpgradeModal").checked = true
                }, 900)
            }
        }
    }

    const switchTheme = newTheme => {
        handleThemeChange(newTheme)
    }

    return <ThemeContext.Provider value={{ theme, switchTheme }}>{children}</ThemeContext.Provider>
}
