import i18n from 'i18next';import k from "./../i18n/keys";export default function FolderSelect({ folders, onChange, selectedFolder }) {
  return (
    <select onChange={(e) => onChange(e.target.value)} id="categories" defaultValue={selectedFolder ?? ""} className="select select-bordered w-full">
            <option value="">{i18n.t(k.NO_FOLDER)}</option>
            {folders.map((folder) =>
      <option value={folder} key={folder}>{folder}</option>
      )}
        </select>);

}