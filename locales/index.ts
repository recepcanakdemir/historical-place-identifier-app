import { en } from './en';
import { tr } from './tr';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { it } from './it';
import { ar } from './ar';
import { ru } from './ru';
import { zh } from './zh';
import { ja } from './ja';

// Define the translation structure type based on English
export type TranslationKeys = typeof en;

// Language codes
export const SUPPORTED_LANGUAGE_CODES = ['en', 'tr', 'es', 'fr', 'de', 'it', 'ar', 'ru', 'zh', 'ja'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGE_CODES[number];

// Language configurations
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
} as const;

// All translations
export const translations: Record<LanguageCode, TranslationKeys> = {
  en,
  tr,
  es,
  fr,
  de,
  it,
  ar,
  ru,
  zh,
  ja,
};

// Utility function to get nested translation with fallback
export const getTranslation = (
  language: LanguageCode, 
  keyPath: string, 
  params?: Record<string, string | number>
): string => {
  const translation = translations[language] || translations.en;
  
  // Navigate nested object using dot notation (e.g., 'home.features.multiLanguage.title')
  const keys = keyPath.split('.');
  let value: any = translation;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to English if key doesn't exist
      const fallbackTranslation = translations.en;
      let fallbackValue: any = fallbackTranslation;
      for (const fallbackKey of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
          fallbackValue = fallbackValue[fallbackKey];
        } else {
          return `[Missing: ${keyPath}]`;
        }
      }
      value = fallbackValue;
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return `[Invalid: ${keyPath}]`;
  }
  
  // Replace parameters if provided
  if (params) {
    return Object.entries(params).reduce((text, [key, val]) => {
      return text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, value);
  }
  
  return value;
};

// Import old translations for backward compatibility
import { translations as oldTranslations } from './translations';

// Type-safe translation hook utility with backward compatibility
export const createTranslationGetter = (language: LanguageCode) => {
  const t = translations[language] || translations.en;
  const oldT = oldTranslations[language] || oldTranslations['en'];
  
  return {
    // Direct access to new structured translation object
    ...t,
    
    // Backward compatibility - flatten old translations to root level
    ...oldT,
    
    // Utility method for nested access with parameters
    get: (keyPath: string, params?: Record<string, string | number>) => 
      getTranslation(language, keyPath, params),
      
    // Check if translation exists
    has: (keyPath: string): boolean => {
      const keys = keyPath.split('.');
      let value: any = t;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return false;
        }
      }
      return typeof value === 'string';
    }
  };
};

// Validation utility to check if all languages have the same structure
export const validateTranslations = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  const baseKeys = getAllKeys(en);
  
  for (const [langCode, translation] of Object.entries(translations)) {
    if (langCode === 'en') continue; // Skip base language
    
    const translationKeys = getAllKeys(translation);
    const missingKeys = baseKeys.filter(key => !translationKeys.includes(key));
    
    if (missingKeys.length > 0) {
      missing.push(`${langCode}: ${missingKeys.join(', ')}`);
    }
  }
  
  return { valid: missing.length === 0, missing };
};

// Helper function to get all nested keys from an object
const getAllKeys = (obj: any, prefix = ''): string[] => {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
};