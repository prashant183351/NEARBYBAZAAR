import { createContext, useContext, useState, useEffect } from 'react';
// ...existing code...

interface I18nContextProps {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  translations: Record<string, any>;
}> = ({ children, translations }) => {
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nbz-lang') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('nbz-lang', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  );
};
