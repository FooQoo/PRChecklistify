import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';
import type { GitHubTokensConfiguration, GitHubServerToken } from '../types/githubServer.js';

type GitHubTokensStorage = BaseStorage<GitHubTokensConfiguration> & {
  setToken: (serverId: string, token: string) => Promise<void>;
  getToken: (serverId: string) => Promise<string | undefined>;
  removeToken: (serverId: string) => Promise<void>;
  setActiveServer: (serverId: string) => Promise<void>;
  getActiveServerId: () => Promise<string | undefined>;
  clear: () => Promise<void>;
};

const defaultConfiguration: GitHubTokensConfiguration = {
  tokens: [],
  activeServerId: undefined,
};

const storage = createStorage<GitHubTokensConfiguration>('github-tokens-config', defaultConfiguration, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// Extended storage with custom methods for GitHub tokens management
export const githubTokensStorage: GitHubTokensStorage = {
  ...storage,

  async setToken(serverId: string, token: string) {
    const config = await storage.get();
    const existingIndex = config.tokens.findIndex(t => t.serverId === serverId);

    if (existingIndex !== -1) {
      // Update existing token
      config.tokens[existingIndex].token = token;
    } else {
      // Add new token
      config.tokens.push({ serverId, token });
    }

    await storage.set(config);
  },

  async getToken(serverId: string): Promise<string | undefined> {
    const config = await storage.get();
    const tokenEntry = config.tokens.find(t => t.serverId === serverId);
    return tokenEntry?.token;
  },

  async removeToken(serverId: string) {
    const config = await storage.get();
    config.tokens = config.tokens.filter(t => t.serverId !== serverId);

    // If the removed server was active, clear active server
    if (config.activeServerId === serverId) {
      config.activeServerId = undefined;
    }

    await storage.set(config);
  },

  async setActiveServer(serverId: string) {
    const config = await storage.get();
    config.activeServerId = serverId;
    await storage.set(config);
  },

  async getActiveServerId(): Promise<string | undefined> {
    const config = await storage.get();
    return config.activeServerId;
  },

  async clear() {
    await storage.set(defaultConfiguration);
  },
};

/**
 * Migration helper: Converts legacy single token storage to new multi-server format
 */
export async function migrateLegacyGitHubTokens(
  legacyToken: string,
  legacyApiDomain: string = 'https://api.github.com',
): Promise<void> {
  if (!legacyToken) return;

  const config = await githubTokensStorage.get();

  // Only migrate if no tokens are configured yet
  if (config.tokens.length === 0) {
    const serverId = legacyApiDomain === 'https://api.github.com' ? 'github-com' : 'enterprise';

    await githubTokensStorage.setToken(serverId, legacyToken);
    await githubTokensStorage.setActiveServer(serverId);
  }
}
