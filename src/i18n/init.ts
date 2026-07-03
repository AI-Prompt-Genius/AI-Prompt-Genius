import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { de } from "./translations/de"
import { en } from "./translations/en"
import { es } from "./translations/es"
import { fr } from "./translations/fr"
import { hu } from "./translations/hu"
import { it } from "./translations/it"
import { pt_BR } from "./translations/pt_BR"
import { pt_PT } from "./translations/pt_PT"
import { ru } from "./translations/ru"
import { tr } from "./translations/tr"
import { uk } from "./translations/uk"
import { zh_CN } from "./translations/zh_CN"
import { zh_TW } from "./translations/zh_TW"

i18next.use(initReactI18next).init({
    lng: localStorage.getItem("lng") || "en",
    debug: true,
    resources: {
        de: { translation: de },
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        hu: { translation: hu },
        it: { translation: it },
        pt_BR: { translation: pt_BR },
        pt_PT: { translation: pt_PT },
        ru: { translation: ru },
        tr: { translation: tr },
        uk: { translation: uk },
        zh_CN: { translation: zh_CN },
        zh_TW: { translation: zh_TW },
    },
    fallbackLng: ["en"],
})

// Add this line to your app entrypoint. Usually it is src/index.js
// import './i18n/init';
