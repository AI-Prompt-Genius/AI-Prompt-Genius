import {useState} from "react";
import {deletePrompt, editPrompt, getCurrentTimestamp, uuid} from "./js/utils.js";
import {EditIcon, TrashIcon} from "./icons/Icons.jsx";

export default function Template(props){
    const template = props.template;

    const [editModalVisible, setEditModalVisible] = useState(false)
    const [title, setTitle] = useState(template.title ?? "");
    const [text, setText] = useState(template.text ?? "");
    const [tags, setTags] = useState(template.tags ?? "");

    function showModal(){
        setEditModalVisible(true)
    }

    function closeModal() {
        document.getElementById("prompt-modal").checked = false;
        setTimeout(()=>setEditModalVisible(false), 100); // to allow for cool animation
    }

    const handleSave = () => {
        let newPrompts = editPrompt(template.id, {title, text, tags, id: template.id ?? uuid(),
            lastEdited: getCurrentTimestamp()})
        props.setPrompts(newPrompts)

        // Close the modal if needed
        // You can add your logic here to close the modal.
        closeModal()
    };

    function removePrompt(id){
        const newPrompts = deletePrompt(id)
        props.setPrompts(newPrompts)
    }



    return (
        <>
        <div onClick={(e) => {if (e.target.classList.contains("mainClick")) props.onClick()}}
            id={template.id}
            className="mainClick card w-full bg-base-200/50 shadow-md template mb-3 cursor-pointer transition-colors hover:bg-base-300/50"
        >
            <div className="mainClick card-body flex flex-row p-4 justify-between align-top">
                <div className="mainClick flex flex-col">
                    <h2 className="card-title mainClick flex">{template.title ?? ""}</h2>
                    <p className="text-base mainClick">
                        {template.description ?? template.text ?? ""}
                    </p>
                </div>
                <div className="mainClick buttons flex">
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
                            <textarea onChange={(e) => setText(e.target.value)}
                                      className="textarea textarea-bordered w-full h-[50px]"
                                      defaultValue={template.description ?? ""}
                                      placeholder="A breif description of the prompt."
                            >
                            </textarea>
                            <div className="text-sm font-bold py-3">
                                Tags
                            </div>
                            <textarea onChange={(e) => setTags(e.target.value.split(","))}
                                      className="textarea textarea-bordered w-full h-[25px]"
                                      defaultValue={template.tags ? template.tags : ""}
                                      placeholder="Tags for your prompt. Separate with a comma & no space."
                            ></textarea>
                            <div className="text-sm font-bold py-3">
                                Category
                            </div>
                            <div>
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