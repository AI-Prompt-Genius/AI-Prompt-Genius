export default function Template(props){
    const template = props.template
    return (
        <div onClick={() => props.onClick()}
            id={template.id}
            className="card w-full bg-base-200/50 shadow-md template mb-3 cursor-pointer hover:bg-base-300/50 transition-colors"
        >
            <div className="card-body p-4">
                <h2 className="card-title flex">
                    <span className="block">{template.title} &nbsp; <button className="edit"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button></span>
                </h2>
                <p className="text-base">
                    {template.text}
                </p>
            </div>
        </div>

    )
}