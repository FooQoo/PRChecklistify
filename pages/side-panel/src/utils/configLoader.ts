import type { GitHubServer } from '@extension/storage';
import { githubTokensStorage } from '@extension/storage';
import type { LLMProvider } from '../types';

/**
 * Loads GitHub server configuration from external config or defaults
 */
export function loadGitHubServerConfig(): GitHubServer[] {
  // ビルド時に注入された設定を使用
  const config = __GITHUB_CONFIG__;

  return config.github.servers as GitHubServer[];
}

/**
 * Gets combined GitHub server configuration with tokens
 */
export async function getGitHubServersWithTokens(): Promise<
  Array<GitHubServer & { token?: string; hasToken: boolean }>
> {
  const servers = loadGitHubServerConfig();
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
