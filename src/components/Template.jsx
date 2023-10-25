import React, {useState} from "react";
import {deletePrompt, editFilteredPrompts, editPrompt, getCurrentTimestamp, uuid} from "./js/utils.js";
import {EditIcon, TrashIcon} from "./icons/Icons.jsx";
import FolderSelect from "./FolderSelect.jsx";
import RemoveTag from "./RemoveTag.jsx";
import Tag from "./Tag.jsx";

export default function Template({template, setPrompts, onClick, folders, filteredPrompts, setFilteredPrompts, filterTags, setFilterTags, filterPrompts, selectedFolder, searchTerm}){
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [title, setTitle] = useState(template.title ?? "");
    const [text, setText] = useState(template.text ?? "");
    const [tags, setTags] = useState(template.tags ?? []);
    const [description, setDescription] = useState(template.description ?? "")
    const [folder, setFolder] = useState(template.folder ?? null)

    const tagRef = React.createRef();

    function showModal(){
        setEditModalVisible(true)
    }

    function closeModal() {
        document.getElementById("prompt-modal").checked = false;
        setTimeout(()=>setEditModalVisible(false), 100); // to allow for cool animation
    }

    const handleSave = () => {
        const editedPrompt = {
            title,
            text,
            tags,
            description,
            id: template.id ?? uuid(),
            lastEdited: getCurrentTimestamp(),
            folder: folder
        }
        let newPrompts = editPrompt(template.id, editedPrompt)
        setPrompts(newPrompts)
        const my_filtered = editFilteredPrompts(template.id, editedPrompt, filteredPrompts)
        setFilteredPrompts(my_filtered)
        setFilteredPrompts(my_filtered)

        // Close the modal if needed
        // You can add your logic here to close the modal.
        closeModal()
    };

    function removePrompt(id){
        const newPrompts = deletePrompt(id)
        setPrompts(newPrompts)
        setFilteredPrompts(deletePrompt(id, filteredPrompts))
    }

    function saveFolder(folder){
        setFolder(folder)
    }

    function removeTag(tag){
        setTags((prevTags) => {
            const tagsSet = new Set(prevTags)
            tagsSet.delete(tag)
            return Array.from(tagsSet)
        })
    }

    function filterByTag(tag) {
        let newFiltered = new Set(filterTags)
        if (filterTags.includes(tag)) {
            newFiltered.delete(tag)
            setFilterTags(Array.from(newFiltered))
        }
        else {
            newFiltered.add(tag)
            setFilterTags(Array.from(newFiltered))
        }
        filterPrompts(selectedFolder, Array.from(newFiltered), searchTerm)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevents the default behavior of the Enter key (e.g., form submission)
            const newTag = e.target.value.trim();
            if (newTag) {
                setTags((prevTags) => {
                    const tagsSet = new Set(prevTags); // Create a Set from the previous tags array
                    tagsSet.add(newTag); // Add the new tag to the Set
                    return Array.from(tagsSet); // Convert the Set back to an array
                });
                e.target.value = ""; // Clear the input field
            }
        }
    };

    return (
        <>
        <div onClick={(e) => {if (e.target.classList.contains("mainClick")) onClick()}}
            id={template.id}
            className="mainClick card w-full bg-base-200/50 shadow-md template mb-3 cursor-pointer transition-colors hover:bg-base-300/50"
        >
            <div className="mainClick card-body flex flex-row p-4 justify-between align-top">
                <div className="mainClick flex flex-col">
                    <h2 className="card-title mainClick flex">{template.title ?? ""}</h2>
                    <p className="text-base mainClick">
                        {(template.description && template.description !== "") ? template.description : (template.text ?? "")}
                    </p>
                    <div className={"flex flex-wrap"}>
                        {template.tags && template.tags.map((tag, i) => (
                            <Tag filterTags={filterTags} key={i} tag={tag} onClick={() => filterByTag(tag)}/>
                        ))}
                    </div>
                </div>
                <div className="mainClick buttons flex max-[600px]:flex-col">
                    <button onClick={showModal} className="edit my-1 border-none btn p-1 bg-inherit"><EditIcon></EditIcon></button>
                    <button onClick={() => removePrompt(template.id)} className="my-1 border-none btn p-1 bg-inherit"><TrashIcon></TrashIcon></button>
                </div>
            </div>
        </div>

        {editModalVisible && (
            <>
                <input defaultChecked type="checkbox" id="prompt-modal" className="modal-toggle hidden" />
                <div className="modal">
                    <div className="modal-box">
                        <div>
                            <div className="text-sm font-bold py-3">
                                Title
                            </div>
                            <textarea onChange={(e) => setTitle(e.target.value)}
                                      className="textarea textarea-bordered w-full h-[25px]" autoFocus
                                      defaultValue={template.title ?? ""}
                                      placeholder="A name for your prompt."
                            >
                            </textarea>
                            <div className="text-sm font-bold py-3">
                                Text
                            </div>
                            <textarea
                                onChange={(e) => setText(e.target.value)}
                                className="textarea textarea-bordered w-full h-[100px]" defaultValue={template.text ?? ""}
                                placeholder="Prompt content. Use {{}} to denote a variable. Ex: {{name}} is a {{adjective}} {{noun}}"
                            ></textarea>
                            <div className="text-sm font-bold py-3">
                                Description
                            </div>
                            <textarea onChange={(e) => setDescription(e.target.value)}
                                      className="textarea textarea-bordered w-full h-[50px]"
                                      defaultValue={template.description ?? ""}
                                      placeholder="A breif description of the prompt."
                            >
                            </textarea>
                            <div className="text-sm font-bold py-3">
                                Tags
                            </div>
                            {/* eslint-disable-next-line react/prop-types */}
                            <div className="flex flex-wrap mb-2">
                                {template.tags && (
                                    // eslint-disable-next-line react/prop-types
                                    tags.map((tag, i) => (
                                        <RemoveTag tag={tag} key={i}
                                                   onClick={() => removeTag(tag)}
                                        ></RemoveTag>
                                    ))
                                )}
                            </div>
                            <input  className="input input-bordered w-full h-[40px]"
                                    placeholder="Press enter to add a tag"
                                    ref={tagRef}
                                    onKeyDown={handleKeyDown}
                            ></input>
                            <div className="text-sm font-bold py-3">
                                Folder
                            </div>
                            <div>
                                <FolderSelect folders={folders} selectedFolder={folder} onChange={(value) => saveFolder(value)}/>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop">
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            </>
        )}
        </>
    )
}