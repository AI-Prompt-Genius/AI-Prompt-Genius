import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { en } from "./translations/en.js"
import { zh_CN } from "./translations/zh_CN.js"

i18next.use(initReactI18next).init({
    lng: localStorage.getItem("lng") || "en",
    debug: true,
    resources: {
        en: { translation: en },
        zh_CN: { translation: zh_CN },
    },
    fallbackLng: ["en"],
})

// Add this line to your app entrypoint. Usually it is src/index.js
// import './i18n/init';
