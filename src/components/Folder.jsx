import {FolderIcon} from "./icons/Icons.jsx";

export default function Folder(props){
    let folder = props.folder
    return (
    <li className="folder" id={`folder-${folder.id}`} data-folder-name={folder.name}>
        <a onClick={() => props.onClick()}>
            <FolderIcon></FolderIcon>
            {folder.name}
        </a>
    </li>
    )
}