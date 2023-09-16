import './App.css'
import Sidebar from "./components/Sidebar.jsx";
import MainContent from "./components/MainContent.jsx";
import React from "react";
import {ThemeContext} from "./components/ThemeContext.jsx";

function App() {
    const { theme } = React.useContext(ThemeContext);

    return (
      <div data-theme={theme} className={`flex bg-base-100 w-[700px] h-[500px] overflow-hidden font-neuemontreal`}>
        <Sidebar />
        <MainContent />
      </div>
  );
}

export default App
