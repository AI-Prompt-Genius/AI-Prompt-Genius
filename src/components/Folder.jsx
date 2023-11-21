import i18n from "i18next"
import k from "./../i18n/keys"
import { FolderIcon } from "./icons/Icons.jsx"

export default function Folder(props) {
    let folder = props.folder
    return (
        <li className="folder" id={`${i18n.t(k.FOLDER)}${folder}`} data-folder-name={folder}>
            <a onClick={() => props.onClick()}>
                <FolderIcon></FolderIcon>
                {folder}
            </a>
        </li>
    )
}
