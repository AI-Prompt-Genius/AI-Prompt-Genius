import { createContext, useEffect } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"

export const ThemeContext = createContext()

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useLocalStorage("theme", "winter")

    useEffect(() => {
        setTheme(theme)
    }, [])

    const switchTheme = newTheme => {
        setTheme(newTheme)
    }

    return <ThemeContext.Provider value={{ theme, switchTheme }}>{children}</ThemeContext.Provider>
}
