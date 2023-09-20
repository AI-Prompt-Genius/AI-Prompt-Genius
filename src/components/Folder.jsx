import {FolderIcon} from "./icons/Icons.jsx";

export default function Folder(props){
    let folder = props.folder
    return (
    <li className="folder" data-folder-name={folder.name}>
        <a>
            <FolderIcon></FolderIcon>
            {folder.name}
        </a>
    </li>
    )
}