export default function Template(props){
    const template = props.template
    return (
        <div
            id={template.id}
            className="card w-full bg-base-200/50 shadow-md template mb-3 cursor-pointer hover:bg-base-300/50 transition-colors"
        >
            <div className="card-body p-4">
                <h2 className="card-title flex">
                    <span className="block">
        {template.title}
      </span>
                </h2>
                <p className="text-base">
                    {template.text}
                </p>
            </div>
        </div>

    )
}