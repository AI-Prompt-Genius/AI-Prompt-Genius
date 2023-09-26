export default function Tag({tag, onClick}){
    return (
        <div onClick={() => onClick()} className={"flex items-center w-fit justify-center border border-base-300 hover:border-accent rounded-full px-[0.65em] py-[0.2em] cursor-pointer text-xs leading-4 mr-1 mb-1"}>
            {tag}
        </div>
    )
}
