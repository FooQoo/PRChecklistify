import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Define the supported languages
type Language = 'en' | 'ja' | 'auto';

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
   * Set language to auto-detect from browser settings
   */
  setAuto: () => Promise<void>;
};

// Create the base storage with 'auto' as the default value
const storage = createStorage<Language>('language-preference', 'auto', {
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
  setAuto: async () => {
    await storage.set('auto');
  },
};
