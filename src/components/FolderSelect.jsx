export default function FolderSelect({folders, onChange, selectedFolder}) {
    return (
        <select onChange={(e) => onChange(e.target.value)} id="categories"  defaultValue={selectedFolder ?? ""} className="select select-bordered w-full">
            <option value="">No Folder</option>
            {folders.map((folder) =>
                <option value={folder} key={folder}>{folder}</option>
            )}
        </select>
    );
}