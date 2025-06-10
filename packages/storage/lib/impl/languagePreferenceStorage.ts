import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Define the supported languages
export type Language = 'en' | 'ja' | 'ko' | 'zh';

export const defaultLanguage: Language = 'ja';

export const getLanguageLabel = (lang: Language): string => {
  switch (lang) {
    case 'en':
      return 'English';
    case 'ja':
      return '日本語';
    case 'ko':
      return '한국어';
    case 'zh':
      return '中文';
    default:
      return 'Unknown Language';
  }
};

type LanguagePreferenceStorage = BaseStorage<Language> & {
  /**
   * Set language to English
   */
  setEnglish: () => Promise<void>;

  /**
   * Set language to Japanese
   */
  setJapanese: () => Promise<void>;

  /**
   * Set language to Korean
   */
  setKo: () => Promise<void>;

  /**
   * Set language to Chinese
   */
  setZh: () => Promise<void>;
};

// Create the base storage with 'en' as the default value
const storage = createStorage<Language>('language-preference', defaultLanguage, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// Extend the base storage with language-specific methods
export const languagePreferenceStorage: LanguagePreferenceStorage = {
  ...storage,
  setEnglish: async () => {
    await storage.set('en');
  },
  setJapanese: async () => {
    await storage.set('ja');
  },
  setKo: async () => {
    await storage.set('ko');
  },
  setZh: async () => {
    await storage.set('zh');
  },
};
