import i18next from "i18next"
import { useState } from "react"

export default function LanguageSelect({ onLangUpdate }) {
    const selectedLang = i18next.language ?? "en"
    const [selectedLanguage, setSelectedLanguage] = useState(selectedLang)

    const languages = {
        de: "German - Deutsch",
        en: "English",
        es: "Spanish - Español",
        fr: "French - Français",
        hu: "Hungarian - Magyar",
        it: "Italian - Italiano",
        pt_BR: "Portuguese (Brazil) - Português (Brasil)",
        pt_PT: "Portuguese (Portugal) - Português (Portugal)",
        ru: "Russian - Русский",
        tr: "Turkish - Türkçe",
        uk: "Ukrainian - Українська",
        zh_CN: "Chinese (Simplified) - 中文（简体)",
        zh_TW: "Chinese (Traditional) - 中文（繁體)",
    }

    function updateLang(event) {
        const language = event.target.value
        setSelectedLanguage(language)
        localStorage.setItem("lng", language)
        i18next.changeLanguage(language, err => {
            if (err) return console.log("something went wrong loading", err)
        })
    }

    return (
        <select className="select select-bordered" value={selectedLanguage} onChange={updateLang}>
            {Object.entries(languages).map(([abbrev, fullName], index) => (
                <option key={index} value={abbrev}>
                    {fullName}
                </option>
            ))}
        </select>
    )
}
