import CategorySelect from "./CategorySelect.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
export default function MainContent(props) {
    return (
        <div className="flex flex-col w-4/5">
            <div className="sticky flex p-4 align-middle justify-center">
                <div className="grow mr-3">
                    <CategorySelect categories={props.categories}/>
                </div>
                <div className="flex flex-col justify-center align-middle">
                    <ThemeToggle />
                </div>
            </div>

            <div className="h-full overflow-y-auto">
                <ul className="flex flex-col mr-8" id="templates">
                    {/* Templates here */}
                </ul>
            </div>
        </div>
    );
}