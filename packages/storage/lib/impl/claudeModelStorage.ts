import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('claude-model', 'claude-3-7-sonnet-20250219', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const claudeModelStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set('claude-3-7-sonnet-20250219');
  },
};
