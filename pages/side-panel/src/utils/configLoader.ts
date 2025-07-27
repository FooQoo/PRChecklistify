/**
 * ストレージが空の場合、ビルド時設定(__GITHUB_CONFIG__)からGitHubサーバー情報を初期化
 */
import { initServersFromConfigIfEmpty } from '@extension/storage/lib/impl/githubServersStorage';

import type { GitHubServer } from '@extension/storage';
import { githubTokensStorage, githubServersStorage } from '@extension/storage';
import type { LLMProvider } from '../types';

export async function initGitHubServersFromBuildConfigIfEmpty() {
  await initServersFromConfigIfEmpty(__GITHUB_CONFIG__);
}

/**
 * Loads GitHub server configuration from storage (user-defined) with fallback to external config
 */
export async function loadGitHubServerConfig(): Promise<GitHubServer[]> {
  // ストレージが空ならビルド時設定から初期化
  await initGitHubServersFromBuildConfigIfEmpty();
  try {
    // First try to load from user storage
    const userServers = await githubServersStorage.getAllServers();
    if (userServers.length > 0) {
      return userServers;
    }
  } catch (error) {
    console.warn('Failed to load user-defined GitHub servers:', error);
  }

  // Fallback to build-time config if available
  try {
    const config = __GITHUB_CONFIG__;
    return config.github.servers as GitHubServer[];
  } catch (error) {
    console.warn('Failed to load build-time GitHub config:', error);
    // Return default GitHub.com server as ultimate fallback
    return [
      {
        id: 'github.com',
        name: 'GitHub.com',
        apiUrl: 'https://api.github.com',
        webUrl: 'https://github.com',
      },
    ];
  }
}

/**
 * Gets combined GitHub server configuration with tokens
 */
export async function getGitHubServersWithTokens(): Promise<
  Array<GitHubServer & { token?: string; hasToken: boolean }>
> {
  const servers = await loadGitHubServerConfig();
  const tokensConfig = await githubTokensStorage.get();

  return servers.map(server => {
    const token = tokensConfig.tokens.find(t => t.serverId === server.id)?.token;
    return {
      ...server,
      token,
      hasToken: !!token,
    };
  });
}

/**
 * Gets the first available server with token (fallback when no specific server is requested)
 */
export async function getActiveGitHubServer(): Promise<(GitHubServer & { token?: string }) | undefined> {
  try {
    // Return first server with token
    const serversWithTokens = await getGitHubServersWithTokens();
    return serversWithTokens.find(s => s.hasToken);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return undefined;
  }
}

/**
 * Loads LLM service configuration from external config
 */
export function loadLLMServiceConfig(): LLMProvider[] {
  // ビルド時に注入された設定を使用
  const config = __LLM_CONFIG__;

  if (config.llmServices && Array.isArray(config.llmServices.providers)) {
    return config.llmServices.providers as LLMProvider[];
  }

  throw new Error('Failed to load LLM service configuration');
}

/**
 * Gets LLM provider by ID
 */
export function getLLMProviderById(providerId: string): LLMProvider {
  const providers = loadLLMServiceConfig();
  const provider = providers.find(provider => provider.id === providerId);
  if (!provider) {
    throw new Error(`LLM provider not found: ${providerId}`);
  }
  return provider;
}

/**
 * Gets all available LLM providers
 */
export function getAllLLMProviders(): LLMProvider[] {
  return loadLLMServiceConfig();
}
