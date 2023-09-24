import './App.css'
import Sidebar from "./components/Sidebar.jsx";
import MainContent from "./components/MainContent.jsx";
import React from "react";
import {ThemeContext} from "./components/ThemeContext.jsx";
import {useLocalStorage} from "@uidotdev/usehooks";

function App() {
    const { theme } = React.useContext(ThemeContext);
    const [prompts, setPrompts] = useLocalStorage("prompts", JSON.stringify([]))
    const [folders, setFolders] = useLocalStorage("folders", JSON.stringify([]))
    const promptArray = JSON.parse(prompts)
    const folderArray = JSON.parse(folders)
    const tags = promptArray.length > 0 ? new Set(promptArray.flatMap(obj => obj.tags)) : [];

    return (
      <div data-theme={theme} className={`flex bg-base-100 w-[100vw] h-[100vh] overflow-hidden`}>
        <Sidebar setPrompts={setPrompts} setFolders={setFolders} folders={folderArray}/>
        <MainContent setPrompts={setPrompts} prompts={promptArray} tags={tags} folders={folderArray}/>
      </div>
  );
}

export default App
