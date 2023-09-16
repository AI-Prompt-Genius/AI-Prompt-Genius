import Logo from "./Logo.jsx"
export default function Sidebar() {
    return (
        <div className="z-30 flex w-[230px] mr-[25px] flex-col overflow-hidden h-full">
            <div className="flex grow flex-col h-full overflow-y-auto border-r border-base-200 bg-base-200">
                <Logo />
                <ul id="folderList" className="menu p-4 text-base-content sticky">
                    {/* Sidebar content here */}
                </ul>
            </div>
        </div>
    );
}