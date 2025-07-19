import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('geminiModel', '', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const geminiModelStorage: BaseStorage<string> = {
  ...storage,
};
