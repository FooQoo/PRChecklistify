import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Model client type enum to avoid circular dependencies
export enum ModelClientType {
  OpenAI = 'openai',
  Gemini = 'gemini',
  Claude = 'claude',
}

const storage = createStorage<ModelClientType>('modelClientType', ModelClientType.Gemini, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
  serialization: {
    serialize: (value: ModelClientType) => value as string,
    deserialize: (text: string) => text as ModelClientType,
  },
});

export const modelClientTypeStorage: BaseStorage<ModelClientType> = {
  ...storage,
  get: async () => {
    return storage.get();
  },
};
