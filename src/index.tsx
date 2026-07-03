import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import ThemeProvider from "./components/ThemeContext"
import "./i18n/init"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </React.StrictMode>,
)
