import i18next from 'i18next';
import {en} from "./english.js"
import {zh} from "./chinese.js";

const english = en;
const chinese = zh;

i18next.init({
  lng: localStorage.getItem('lng') || 'zh_CN',
  debug: true,
  resources: {
    en: { translation: english },
    'zh_CN': { translation: chinese },
  },
});

// Add this line to your app entrypoint. Usually it is src/index.js
// import './i18n/init';
