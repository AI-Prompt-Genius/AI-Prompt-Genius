import {XMark} from "./icons/Icons.jsx";

export default function RemoveTag({tag}){
    return (
        <span className={"inline-block justify-center border border-hsl-[var(--n)] rounded-full px-2 py-1 cursor-pointer text-xs leading-4 mr-1 mb-1"}>
           <XMark /> {tag}
        </span>
    )
}