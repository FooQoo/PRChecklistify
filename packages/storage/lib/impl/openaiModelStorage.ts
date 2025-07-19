import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('openaiModel', '', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const openaiModelStorage: BaseStorage<string> = {
  ...storage,
};
