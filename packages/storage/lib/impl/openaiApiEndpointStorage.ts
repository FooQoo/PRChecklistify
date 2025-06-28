import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

/**
 * Storage utility for OpenAI API endpoint
 */
const storage = createStorage<string>('openai-api-endpoint', 'https://api.openai.com/v1', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const openaiApiEndpointStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set('https://api.openai.com/v1');
  },
};
