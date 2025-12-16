import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultTranslations, Dictionary, TranslationKey } from '../services/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
  availableLanguages: string[];
  importLanguage: (fileContent: string) => Promise<boolean>;
  exportLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('de');
  const [translations, setTranslations] = useState(defaultTranslations);

  useEffect(() => {
    // Load persisted settings
    const savedLang = localStorage.getItem('app_lang');
    const savedCustomTranslations = localStorage.getItem('custom_translations');

    if (savedCustomTranslations) {
      try {
        const parsed = JSON.parse(savedCustomTranslations);
        setTranslations(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load custom translations", e);
      }
    }

    if (savedLang && (defaultTranslations[savedLang] || (savedCustomTranslations && JSON.parse(savedCustomTranslations)[savedLang]))) {
      setLanguageState(savedLang);
    } else {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0];
        if (defaultTranslations[browserLang]) {
            setLanguageState(browserLang);
        }
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations['de'];
    return dict[key] || key;
  };

  const importLanguage = async (jsonContent: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonContent);
      // Validate structure roughly
      if (!data.code || !data.dictionary) {
          throw new Error("Invalid format. Need 'code' and 'dictionary' keys.");
      }
      
      const newTranslations = { ...translations, [data.code]: data.dictionary };
      setTranslations(newTranslations);
      
      // Persist custom translations (exclude defaults to save space, but for simplicity saving everything here or just the new one)
      // Ideally we only save added languages to localStorage
      const customOnly = { ...newTranslations };
      // Note: This simple implementation saves everything back to LS.
      localStorage.setItem('custom_translations', JSON.stringify(customOnly));
      
      setLanguage(data.code);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const exportLanguage = () => {
    const dict = translations[language];
    const data = {
        code: language,
        dictionary: dict
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashmind_${language}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <LanguageContext.Provider value={{ 
        language, 
        setLanguage, 
        t, 
        availableLanguages: Object.keys(translations),
        importLanguage,
        exportLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
