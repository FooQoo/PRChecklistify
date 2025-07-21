import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';
import type { GitLabTokensConfiguration } from '../types/gitlabServer.js';

type GitLabTokensStorage = BaseStorage<GitLabTokensConfiguration> & {
  setToken: (serverId: string, token: string) => Promise<void>;
  getToken: (serverId: string) => Promise<string | undefined>;
  removeToken: (serverId: string) => Promise<void>;
  setActiveServer: (serverId: string) => Promise<void>;
  getActiveServerId: () => Promise<string | undefined>;
  clear: () => Promise<void>;
};

const defaultConfiguration: GitLabTokensConfiguration = {
  tokens: [],
  activeServerId: undefined,
};

const storage = createStorage<GitLabTokensConfiguration>('gitlabTokensConfig', defaultConfiguration, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const gitlabTokensStorage: GitLabTokensStorage = {
  ...storage,

  async setToken(serverId: string, token: string) {
    const config = await storage.get();
    const existingIndex = config.tokens.findIndex(t => t.serverId === serverId);

    if (existingIndex !== -1) {
      config.tokens[existingIndex].token = token;
    } else {
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
