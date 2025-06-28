import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

/**
 * Storage utility for GitHub API domain
 */
const storage = createStorage<string>('github-api-domain', 'https://api.github.com', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const githubApiDomainStorage: BaseStorage<string> & { clear: () => Promise<void> } = {
  ...storage,
  clear: async () => {
    await storage.set('https://api.github.com');
  },
};
