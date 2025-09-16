import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentLanguage, changeLanguage, SUPPORTED_LANGUAGES } from '../services/languageService';
import { translations } from '../locales/translations';

interface LanguageContextType {
  language: string;
  texts: any;
  setLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      const currentLang = await getCurrentLanguage();
      setCurrentLanguage(currentLang);
    } catch (error) {
      console.error('Error initializing language:', error);
      setCurrentLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: string) => {
    try {
      setIsLoading(true);
      await changeLanguage(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const texts = translations[language] || translations['en'];

  const value: LanguageContextType = {
    language,
    texts,
    setLanguage,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};