import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Gemini AI models configuration
export const GEMINI_MODELS = {
  'gemini-2.5-pro': 'gemini-2.5-pro',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-pro': 'gemini-1.5-pro',
  'gemini-2.0-flash': 'gemini-2.0-flash',
} as const;

export type GeminiModelType = keyof typeof GEMINI_MODELS;
export const DEFAULT_GEMINI_MODEL: GeminiModelType = 'gemini-2.5-pro';

// Get all available Gemini models as array
export const getGeminiModelOptions = () => {
  return Object.entries(GEMINI_MODELS).map(([value, label]) => ({
    value,
    label,
  }));
};

const storage = createStorage<string>('gemini-model', DEFAULT_GEMINI_MODEL, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const geminiModelStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set(DEFAULT_GEMINI_MODEL);
  },
};
