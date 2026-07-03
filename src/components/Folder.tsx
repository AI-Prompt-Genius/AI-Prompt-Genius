import { FolderIcon } from "./icons/Icons"

export default function Folder(props: { folder: string; onClick: () => void; id?: string }) {
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
