import {FolderIcon} from "./icons/Icons.jsx";

export default function Folder(props){
    let folder = props.folder
    return (
    <li className="folder" id={`folder-${folder}`} data-folder-name={folder}>
        <a onClick={() => props.onClick()}>
            <FolderIcon></FolderIcon>
            {folder}
        </a>
    </li>
    )
}