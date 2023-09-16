import {createContext, useEffect} from "react";
import { useLocalStorage } from "@uidotdev/usehooks";

export const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useLocalStorage('theme', 'default');

    useEffect(() => {
        // replace setup() function
        // const localTheme = await getFromStorage('theme', 'default');
        setTheme(theme);
    }, []);

    const switchTheme = () => {
        const newTheme = theme === 'default' ? 'night' : 'default';
        setTheme(newTheme);
        // chrome.storage.local.set({'theme': newTheme});
    };

    return (
        <ThemeContext.Provider value={{ theme, switchTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}