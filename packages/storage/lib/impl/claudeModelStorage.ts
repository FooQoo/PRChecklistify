import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('claudeModel', '', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const claudeModelStorage: BaseStorage<string> = {
  ...storage,
};
