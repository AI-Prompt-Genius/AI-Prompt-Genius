import './App.css'
import Sidebar from "./components/Sidebar.jsx";
import MainContent from "./components/MainContent.jsx";
import React, {useState} from "react";
import {ThemeContext} from "./components/ThemeContext.jsx";
import {useLocalStorage} from "@uidotdev/usehooks";
import {newFilteredPrompt} from "./components/js/utils.js";

function App() {
    const { theme } = React.useContext(ThemeContext);
    const [prompts, setPrompts] = useLocalStorage("prompts", JSON.stringify([]))
    const [folders, setFolders] = useLocalStorage("folders", JSON.stringify([]))

    const promptArray = JSON.parse(prompts)
    const folderArray = JSON.parse(folders)
    const tags = promptArray.length > 0 ? new Set(promptArray.flatMap(obj => obj.tags)) : [];

    const [filteredPrompts, setFilteredPrompts] = useState(promptArray)
    const [selectedFolder, setSelectedfolder] = useState("")
    const [filterTags, setFilterTags] = useState([])
    const [searchTerm, setSearchTerm] = useState("")

    function filterPrompts(folder="", tags=[], searchTerm = ""){
        let newFiltered = promptArray;
        if (tags.length > 0){
            newFiltered = newFiltered.filter((prompt) => {
                // Check if all tags in the filterTags array are included in each prompt's tags array
                return tags.every((filterTag) => prompt.tags.includes(filterTag));
            });
        }

        if (folder !== ""){
            newFiltered = newFiltered.filter(obj => obj.folder === folder)
        }

        if (searchTerm !== ""){
            searchTerm = searchTerm.toLowerCase(); // convert search term to lowercase
            newFiltered = newFiltered.filter(prompt =>
                prompt.text?.toLowerCase().includes(searchTerm) ||
                prompt.description?.toLowerCase().includes(searchTerm) ||
                prompt.title?.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredPrompts(newFiltered)
    }


    return (
      <div data-theme={theme} className={`flex bg-base-100 w-[100vw] h-[100vh] overflow-hidden`}>
        <Sidebar
            filteredPrompts={filteredPrompts}
            setFilteredPrompts={setFilteredPrompts}
            filterPrompts={filterPrompts}
            setPrompts={setPrompts}
            setFolders={setFolders}
            folders={folderArray}
            setSelectedFolder={setSelectedfolder}
            selectedFolder={selectedFolder}
            filterTags={filterTags}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />
        <MainContent
            filteredPrompts={filteredPrompts}
            setFilteredPrompts={setFilteredPrompts}
            filterPrompts={filterPrompts}
            setPrompts={setPrompts}
            prompts={promptArray}
            tags={tags}
            folders={folderArray}
            filterTags={filterTags}
            setFilterTags={setFilterTags}
            setSelectedFolder={setSelectedfolder}
            selectedFolder={selectedFolder}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />
      </div>
  );
}

export default App
