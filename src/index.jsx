import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ThemeProvider from "./components/ThemeContext.jsx";
import "./i18n/init";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
