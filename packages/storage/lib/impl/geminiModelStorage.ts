import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('gemini-model', 'gemini-2.5-pro', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const geminiModelStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set('gemini-2.5-pro');
  },
};
