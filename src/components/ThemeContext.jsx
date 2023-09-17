import {createContext, useEffect} from "react";
import { useLocalStorage } from "@uidotdev/usehooks";

export const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useLocalStorage('theme', 'light');

    useEffect(() => {
        // replace setup() function
        // const localTheme = await getFromStorage('theme', 'light');
        setTheme(theme);
    }, []);

    const switchTheme = () => {
        const newTheme = theme === 'light' ? 'night' : 'light';
        setTheme(newTheme);
        // chrome.storage.local.set({'theme': newTheme});
    };

    return (
        <ThemeContext.Provider value={{ theme, switchTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}