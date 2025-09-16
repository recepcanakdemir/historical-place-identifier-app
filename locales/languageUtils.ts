// Enhanced language utilities for future migration
// This file provides utilities for the new structured approach
// while maintaining compatibility with the existing system

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const ENHANCED_SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
};

// Utility to validate translations completeness
export const validateLanguageTranslations = (translations: Record<string, any>): {
  complete: string[];
  incomplete: string[];
  missingKeys: Record<string, string[]>;
} => {
  const baseLanguage = 'en';
  const baseKeys = Object.keys(translations[baseLanguage] || {});
  
  const complete: string[] = [];
  const incomplete: string[] = [];
  const missingKeys: Record<string, string[]> = {};
  
  Object.keys(ENHANCED_SUPPORTED_LANGUAGES).forEach(langCode => {
    if (langCode === baseLanguage) return;
    
    const langTranslations = translations[langCode] || {};
    const langKeys = Object.keys(langTranslations);
    const missing = baseKeys.filter(key => !langKeys.includes(key));
    
    if (missing.length === 0) {
      complete.push(langCode);
    } else {
      incomplete.push(langCode);
      missingKeys[langCode] = missing;
    }
  });
  
  return { complete, incomplete, missingKeys };
};

// Utility to add missing translation keys with placeholders
export const addMissingTranslationKeys = (
  translations: Record<string, any>,
  languageCode: string,
  missingKeys: string[]
): Record<string, any> => {
  const baseTranslations = translations['en'] || {};
  const langTranslations = { ...translations[languageCode] };
  
  missingKeys.forEach(key => {
    // Use English as fallback with a marker
    langTranslations[key] = `[${languageCode.toUpperCase()}] ${baseTranslations[key] || key}`;
  });
  
  return {
    ...translations,
    [languageCode]: langTranslations
  };
};

// Utility for parameter replacement in strings
export const interpolateString = (
  template: string,
  params: Record<string, string | number>
): string => {
  return Object.entries(params).reduce((text, [key, value]) => {
    return text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, template);
};

// Generate language list for UI
export const getLanguageList = () => {
  return Object.values(ENHANCED_SUPPORTED_LANGUAGES);
};

// Check if a language is RTL (right-to-left)
export const isRTLLanguage = (languageCode: string): boolean => {
  return ['ar'].includes(languageCode);
};

// Get language direction for styling
export const getLanguageDirection = (languageCode: string): 'ltr' | 'rtl' => {
  return isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
};