import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<string>('openai-model', '', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const openaiModelStorage: BaseStorage<string> = {
  ...storage,
};
