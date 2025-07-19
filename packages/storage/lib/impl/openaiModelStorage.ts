import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// OpenAI models configuration - fallback for when JSON config is not available
export const OPENAI_MODELS = {
  'gpt-4o': 'gpt-4o',
  'gpt-4.1': 'gpt-4.1',
  'o4-mini': 'o4-mini',
  o3: 'o3',
} as const;

export type OpenAIModelType = keyof typeof OPENAI_MODELS;
export const DEFAULT_OPENAI_MODEL: OpenAIModelType = 'gpt-4o';

// Get all available OpenAI models as array - fallback implementation (deprecated - use JSON config)
export const getOpenAIModelOptions = () => {
  return Object.entries(OPENAI_MODELS).map(([value, label]) => ({
    value,
    label,
  }));
};

const storage = createStorage<string>('openai-model', DEFAULT_OPENAI_MODEL, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const openaiModelStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set(DEFAULT_OPENAI_MODEL);
  },
};
