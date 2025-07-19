import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('instructionPath', '', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const instructionPathStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set('');
  },
};
