import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import koTranslation from './locales/ko.json';

// 번역 리소스
const resources = {
  en: {
    translation: enTranslation
  },
  ko: {
    translation: koTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // 기본 언어 설정
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // XSS 방지를 위한 이스케이프 비활성화 (React에서는 기본적으로 처리됨)
    }
  });

export default i18n;