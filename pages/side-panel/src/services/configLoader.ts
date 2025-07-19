import type { GitHubServer } from '@extension/storage';

/**
 * Loads GitHub server configuration from external config or defaults
 */
export async function loadGitHubServerConfig(): Promise<GitHubServer[]> {
  try {
    // ビルド時に注入された設定を使用
    const config = __GITHUB_CONFIG__;

    if (config.github && Array.isArray(config.github.servers)) {
      return config.github.servers as GitHubServer[];
    }
  } catch (error) {
    console.warn('Failed to load GitHub config:', error);
  }

  throw new Error('Failed to load GitHub server configuration');
}

/**
 * Gets combined GitHub server configuration with tokens
 */
export async function getGitHubServersWithTokens(): Promise<
  Array<GitHubServer & { token?: string; hasToken: boolean }>
> {
  try {
    const servers = await loadGitHubServerConfig();
    const { githubTokensStorage } = await import('@extension/storage');
    const tokensConfig = await githubTokensStorage.get();

    return servers.map(server => {
      const token = tokensConfig.tokens.find(t => t.serverId === server.id)?.token;
      return {
        ...server,
        token,
        hasToken: !!token,
      };
    });
  } catch (error) {
    console.error('Failed to get GitHub servers with tokens:', error);
    return [];
  }
}

/**
 * Gets the first available server with token (fallback when no specific server is requested)
 */
export async function getActiveGitHubServer(): Promise<(GitHubServer & { token?: string }) | undefined> {
  try {
    // Return first server with token
    const serversWithTokens = await getGitHubServersWithTokens();
    return serversWithTokens.find(s => s.hasToken);
  } catch (error) {
    console.error('Failed to get active GitHub server:', error);
    return undefined;
  }
}
