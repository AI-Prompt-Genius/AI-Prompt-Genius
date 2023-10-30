import './App.css'
import Sidebar from "./components/Sidebar.jsx";
import MainContent from "./components/MainContent.jsx";
import React, {useEffect, useState} from "react";
import {useLocalStorage} from "@uidotdev/usehooks";
import {ThemeContext} from "./components/ThemeContext.jsx";
import {checkForResync, finishAuth} from "./components/js/cloudSyncing.js";
import {setObject} from "./components/js/utils.js";

function App() {
    const { theme } = React.useContext(ThemeContext);

    const [prompts, setPrompts] = useLocalStorage("prompts", [])
    const [folders, setFolders] = useLocalStorage("folders", [])

    const tags = prompts.length > 0 ? new Set(prompts.flatMap(obj => obj.tags)) : [];

    const [filteredPrompts, setFilteredPrompts] = useState(prompts)
    const [selectedFolder, setSelectedfolder] = useState("")
    const [filterTags, setFilterTags] = useState([])
    const [searchTerm, setSearchTerm] = useState("")

    checkForResync()

    function filterPrompts(folder="", tags=[], searchTerm = ""){
        let newFiltered = prompts;
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

    useEffect(() => {
        const handleMessage = async function(event) {
            const data = JSON.parse(event.data);
            if (data.message === "newAuthToken") {
                setObject("GOOGLE_API_TOKEN", data.token)
                console.log("API TOKEN UPDATED")
                finishAuth()
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            // Clean up the event listener when the component unmounts
            window.removeEventListener("message", handleMessage);
        };
    }, []);


    return (
      <div data-theme={theme} className={`flex bg-base-100 w-[100vw] h-[100vh] overflow-hidden`}>
        <Sidebar
            filteredPrompts={filteredPrompts}
            setFilteredPrompts={setFilteredPrompts}
            filterPrompts={filterPrompts}
            setPrompts={setPrompts}
            setFolders={setFolders}
            folders={folders}
            setSelectedFolder={setSelectedfolder}
            selectedFolder={selectedFolder}
            setFilterTags={setFilterTags}
            filterTags={filterTags}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />
        <MainContent
            filteredPrompts={filteredPrompts}
            setFilteredPrompts={setFilteredPrompts}
            filterPrompts={filterPrompts}
            setPrompts={setPrompts}
            prompts={prompts}
            tags={tags}
            folders={folders}
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
