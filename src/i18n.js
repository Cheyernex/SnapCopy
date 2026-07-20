import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

const savedLang = localStorage.getItem('snapcopy_language');
const detectedLang = (navigator.language || '').slice(0, 2);
const fallbackLang = savedLang || (['en', 'es'].includes(detectedLang) ? detectedLang : 'es');

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: fallbackLang,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
