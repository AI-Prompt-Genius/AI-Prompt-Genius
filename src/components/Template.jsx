import {useState} from "react";
import {editPrompt, getCurrentTimestamp, uuid} from "./js/utils.js";
import CategorySelect from "./CategorySelect.jsx";

export default function Template(props){
    const template = props.template;

    const [editModalVisible, setEditModalVisible] = useState(false)
    const [title, setTitle] = useState(template.title ?? "");
    const [text, setText] = useState(template.text ?? "");
    const [tags, setTags] = useState(template.tags ?? "");
    const [category, setCategory] = useState(template.category ?? "");

    function showModal(){
        setEditModalVisible(true)
    }

    function closeModal() {
        document.getElementById("prompt-modal").checked = false;
        setTimeout(()=>setEditModalVisible(false), 100); // to allow for cool animation
    }

    const handleSave = () => {
        let newPrompts = editPrompt(template.id, {title, text, tags, category, id: template.id ?? uuid(),
            lastEdited: getCurrentTimestamp()})
        props.setPrompts(newPrompts)

        // Close the modal if needed
        // You can add your logic here to close the modal.
        closeModal()
    };

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
                    <button onClick={showModal} className="edit my-1 border-none btn p-1 bg-inherit"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button>
                    <button className="my-1 border-none btn p-1 bg-inherit"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    </button>
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
                                <CategorySelect onChange={(value) => setCategory(value)} categories={props.categories} defaultValue={template.category ?? "all"}/>
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