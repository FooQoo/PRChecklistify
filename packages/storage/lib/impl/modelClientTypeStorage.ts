import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Model client type enum to avoid circular dependencies
export enum ModelClientType {
  OpenAI = 'openai',
  Gemini = 'gemini',
  Claude = 'claude',
}

const storage = createStorage<ModelClientType>('model-client-type', ModelClientType.OpenAI, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const modelClientTypeStorage: BaseStorage<ModelClientType> = {
  ...storage,
};
