import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

type GitHubTokenStorage = BaseStorage<string> & {
  clear: () => Promise<void>;
};

const storage = createStorage<string>('github-token-storage-key', '', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// Extended storage with custom methods for GitHub PAT
export const githubTokenStorage: GitHubTokenStorage = {
  ...storage,
  clear: async () => {
    await storage.set('');
  },
};
