import { createContext, useEffect } from "react"
import type { ReactNode } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"
import { getProStatus } from "./js/pro"
import type { ThemeContextValue } from "../types"

export const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue)

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useLocalStorage("theme", "winter")

    const freeThemes = ["winter", "light", "dark", "night"]

    useEffect(() => {
        setTheme(theme)
    }, [])

    async function handleThemeChange(newTheme: string) {
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
                    ;(document.getElementById("proUpgradeModal") as HTMLInputElement).checked = true
                }, 900)
            }
        }
    }

    const switchTheme = (newTheme: string) => {
        handleThemeChange(newTheme)
    }

    return <ThemeContext.Provider value={{ theme, switchTheme }}>{children}</ThemeContext.Provider>
}
