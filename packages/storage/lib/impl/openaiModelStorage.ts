import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Get default model from build-time config
function getDefaultOpenAIModel(): string {
  try {
    const config = (globalThis as any).__LLM_CONFIG__;
    if (config?.llmServices?.providers) {
      const openaiProvider = config.llmServices.providers.find((p: any) => p.id === 'openai');
      return openaiProvider?.defaultModel || '';
    }
  } catch (error) {
    // Return empty string if config is not available
  }
  return '';
}

const storage = createStorage<string>('openaiModel', getDefaultOpenAIModel(), {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const openaiModelStorage: BaseStorage<string> = {
  ...storage,
};
