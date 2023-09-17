export default function CategorySelect(props) {
    return (
        <select id="categories"  defaultValue={"all"} className="select select-bordered w-full">
            <option value="all" key="all">All Categories</option>
            {props.categories.map((cat) =>
                <option value={cat} key={cat}>{cat}</option>
            )}
        </select>
    );
}