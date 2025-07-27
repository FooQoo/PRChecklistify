import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';
import type { GitHubConfig, GitHubServer } from '../types/githubServer.js';

type GitHubServersStorage = BaseStorage<GitHubServer[]> & {
  addServer: (server: GitHubServer) => Promise<void>;
  updateServer: (serverId: string, server: Partial<GitHubServer>) => Promise<void>;
  removeServer: (serverId: string) => Promise<void>;
  getServer: (serverId: string) => Promise<GitHubServer | undefined>;
  getAllServers: () => Promise<GitHubServer[]>;
};

const defaultServers: GitHubServer[] = [];

const storage = createStorage<GitHubServer[]>('githubServersConfig', defaultServers, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// __GITHUB_CONFIG__相当の値を引数で受け取って初期化する関数
export async function initServersFromConfigIfEmpty(config?: GitHubConfig) {
  const servers = await storage.get();
  if (Array.isArray(servers) && servers.length > 0) return;

  if (config?.github?.servers && Array.isArray(config.github.servers)) {
    const externalServers = config.github.servers;
    if (externalServers.length > 0) {
      await storage.set(externalServers);
    }
  }
}

// Extended storage with custom methods for GitHub servers management
export const githubServersStorage: GitHubServersStorage = {
  ...storage,

  async addServer(server: GitHubServer) {
    const serversData = await storage.get();
    const servers = Array.isArray(serversData) ? serversData : defaultServers;

    // Check if server with same ID already exists
    const existingIndex = servers.findIndex(s => s.id === server.id);
    if (existingIndex !== -1) {
      throw new Error(`Server with ID "${server.id}" already exists`);
    }

    servers.push(server);
    await storage.set(servers);
  },

  async updateServer(serverId: string, serverUpdate: Partial<GitHubServer>) {
    const serversData = await storage.get();
    const servers = Array.isArray(serversData) ? serversData : defaultServers;
    const existingIndex = servers.findIndex(s => s.id === serverId);

    if (existingIndex === -1) {
      throw new Error(`Server with ID "${serverId}" not found`);
    }

    // Merge the update with the existing server
    servers[existingIndex] = { ...servers[existingIndex], ...serverUpdate };
    await storage.set(servers);
  },

  async removeServer(serverId: string) {
    const serversData = await storage.get();
    const servers = Array.isArray(serversData) ? serversData : defaultServers;

    // Check if server exists
    const serverExists = servers.some(s => s.id === serverId);
    if (!serverExists) {
      throw new Error(`Server with ID "${serverId}" not found`);
    }

    // Allow deletion only if there are 2 or more servers
    if (servers.length < 2) {
      throw new Error('Cannot delete the last remaining server. At least one server must remain.');
    }

    const filteredServers = servers.filter(s => s.id !== serverId);
    await storage.set(filteredServers);
  },

  async getServer(serverId: string): Promise<GitHubServer | undefined> {
    const serversData = await storage.get();
    const servers = Array.isArray(serversData) ? serversData : defaultServers;
    return servers.find(s => s.id === serverId);
  },

  async getAllServers(): Promise<GitHubServer[]> {
    const servers = await storage.get();
    return Array.isArray(servers) ? servers : defaultServers;
  },
};
