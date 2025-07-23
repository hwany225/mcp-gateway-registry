import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAsiaAustraliaIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setIsOpen(false);
  };

  // 외부 클릭 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="p-2 text-white hover:text-gray-200 rounded-lg hover:bg-primary-600 flex items-center"
        title="언어 변경 / Change Language"
        onClick={() => setIsOpen(!isOpen)}
      >
        <GlobeAsiaAustraliaIcon className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
          <button
            onClick={() => changeLanguage('en')}
            className={`block w-full text-left px-4 py-2 text-sm ${
              i18n.language === 'en' 
                ? 'text-primary-700 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('ko')}
            className={`block w-full text-left px-4 py-2 text-sm ${
              i18n.language === 'ko' 
                ? 'text-primary-700 dark:text-primary-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            한국어
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;