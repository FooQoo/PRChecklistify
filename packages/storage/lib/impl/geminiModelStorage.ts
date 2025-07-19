import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Get default model from build-time config
function getDefaultGeminiModel(): string {
  try {
    const config = (globalThis as any).__LLM_CONFIG__;
    if (config?.llmServices?.providers) {
      const geminiProvider = config.llmServices.providers.find((p: any) => p.id === 'gemini');
      return geminiProvider?.defaultModel || '';
    }
  } catch (error) {
    // Return empty string if config is not available
  }
  return '';
}

const storage = createStorage<string>('geminiModel', getDefaultGeminiModel(), {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const geminiModelStorage: BaseStorage<string> = {
  ...storage,
};
