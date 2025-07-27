import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';
import type { GitHubServer, GitHubServersConfiguration } from '../types/githubServer.js';

const defaultConfiguration: GitHubServersConfiguration = {
  servers: [],
};

const storage = createStorage<GitHubServersConfiguration>('githubServersConfig', defaultConfiguration, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export type GitHubServersStorage = BaseStorage<GitHubServersConfiguration> & {
  addServer: (server: GitHubServer) => Promise<void>;
  removeServer: (serverId: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const githubServersStorage: GitHubServersStorage = {
  ...storage,
  async addServer(server: GitHubServer) {
    await storage.set(config => ({
      servers: [...config.servers.filter(s => s.id !== server.id), server],
    }));
  },
  async removeServer(serverId: string) {
    await storage.set(config => ({
      servers: config.servers.filter(s => s.id !== serverId),
    }));
  },
  async clear() {
    await storage.set(defaultConfiguration);
  },
};
