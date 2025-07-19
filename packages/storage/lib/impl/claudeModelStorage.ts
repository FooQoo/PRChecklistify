import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Claude AI models configuration - fallback for when JSON config is not available
export const CLAUDE_MODELS = {
  'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
} as const;

export type ClaudeModelType = keyof typeof CLAUDE_MODELS;
export const DEFAULT_CLAUDE_MODEL: ClaudeModelType = 'claude-sonnet-4-20250514';

// Get all available Claude models as array - fallback implementation (deprecated - use JSON config)
export const getClaudeModelOptions = () => {
  return Object.entries(CLAUDE_MODELS).map(([value, label]) => ({
    value,
    label,
  }));
};

const storage = createStorage<string>('claude-model', DEFAULT_CLAUDE_MODEL, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const claudeModelStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set(DEFAULT_CLAUDE_MODEL);
  },
};
