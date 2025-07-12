import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('openai-model', 'gpt-4o', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const openaiModelStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set('gpt-4o');
  },
};
