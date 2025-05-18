import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

type GitHubApiDomainStorage = BaseStorage<string> & {
  clear: () => Promise<void>;
};

// デフォルトのGitHub APIドメイン
const DEFAULT_GITHUB_API_DOMAIN = 'https://api.github.com';

const storage = createStorage<string>('github-api-domain-storage-key', DEFAULT_GITHUB_API_DOMAIN, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// Extended storage with custom methods for GitHub API domain
export const githubApiDomainStorage: GitHubApiDomainStorage = {
  ...storage,
  clear: async () => {
    await storage.set(DEFAULT_GITHUB_API_DOMAIN);
  },
};
