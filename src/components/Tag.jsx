export default function Tag({tag, onClick, filterTags}){
    const tagborder = filterTags.includes(tag) ? "border-accent" : "border-base-300"
    console.log(tagborder)
    return (
        <div onClick={() => onClick()}
             className={`flex items-center w-fit justify-center border ${tagborder} hover:border-accent rounded-full px-[0.65em] py-[0.2em] cursor-pointer text-xs leading-4 mr-1 mb-1`}
        >
            {tag}
        </div>
    )
}
