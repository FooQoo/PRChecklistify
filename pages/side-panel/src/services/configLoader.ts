import type { GitHubServer } from '@extension/storage';

/**
 * Loads GitHub server configuration from external config or defaults
 */
export async function loadGitHubServerConfig(): Promise<GitHubServer[]> {
  try {
    // Try to import the built configuration
    const config = await import('../config/githubServers.json');

    if (config.github && Array.isArray(config.github.servers)) {
      return config.github.servers as GitHubServer[];
    }

    console.warn('Invalid external config structure, using defaults');
    return getDefaultServers();
  } catch (error) {
    console.warn('Failed to load external GitHub config, using defaults:', error);
    return getDefaultServers();
  }
}

/**
 * Returns default GitHub server configuration
 */
function getDefaultServers(): GitHubServer[] {
  return [
    {
      id: 'github-com',
      name: 'GitHub.com',
      apiUrl: 'https://api.github.com',
      webUrl: 'https://github.com',
    },
  ];
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
 * Gets the active server with token
 */
export async function getActiveGitHubServer(): Promise<(GitHubServer & { token?: string }) | undefined> {
  try {
    const { githubTokensStorage } = await import('@extension/storage');
    const tokensConfig = await githubTokensStorage.get();

    if (!tokensConfig.activeServerId) {
      // Return first server with token if no active server
      const serversWithTokens = await getGitHubServersWithTokens();
      return serversWithTokens.find(s => s.hasToken);
    }

    const servers = await loadGitHubServerConfig();
    const activeServer = servers.find(s => s.id === tokensConfig.activeServerId);

    if (activeServer) {
      const token = tokensConfig.tokens.find(t => t.serverId === activeServer.id)?.token;
      return {
        ...activeServer,
        token,
      };
    }

    return undefined;
  } catch (error) {
    console.error('Failed to get active GitHub server:', error);
    return undefined;
  }
}
