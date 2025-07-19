import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Get default model from build-time config
function getDefaultClaudeModel(): string {
  try {
    const config = (globalThis as any).__LLM_CONFIG__;
    if (config?.llmServices?.providers) {
      const claudeProvider = config.llmServices.providers.find((p: any) => p.id === 'claude');
      return claudeProvider?.defaultModel || '';
    }
  } catch (error) {
    // Return empty string if config is not available
  }
  return '';
}

const storage = createStorage<string>('claudeModel', getDefaultClaudeModel(), {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const claudeModelStorage: BaseStorage<string> = {
  ...storage,
};
