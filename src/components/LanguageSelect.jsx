export default function LanguageSelect() {
    const languages = [
        "de",
        "en",
        "es",
        "fr",
        "hu",
        "it",
        "pt_BR",
        "pt_PT",
        "ru",
        "tr",
        "uk",
        "zh_CN",
        "zh_TW",
    ];

    return (
        <select className={"select select-bordered"}>
            {languages.map((language, index) => (
                <option key={index} value={language}>
                    {language}
                </option>
            ))}
        </select>
    );
}
