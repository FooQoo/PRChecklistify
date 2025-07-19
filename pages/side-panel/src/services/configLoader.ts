import type { GitHubServer } from '@extension/storage';

/**
 * Loads GitHub server configuration from external config or defaults
 */
export async function loadGitHubServerConfig(): Promise<GitHubServer[]> {
  // ビルド時に注入された設定を使用
  const config = __GITHUB_CONFIG__;

  if (config.github && Array.isArray(config.github.servers)) {
    return config.github.servers as GitHubServer[];
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return undefined;
  }
}
