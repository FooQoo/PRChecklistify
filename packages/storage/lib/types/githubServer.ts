/**
 * GitHub server configuration
 */
export interface GitHubServer {
  /** Unique identifier for the server */
  id: string;
  /** Display name for the server */
  name: string;
  /** API endpoint URL */
  apiUrl: string;
  /** Web interface URL */
  webUrl: string;
}

export type GitHubConfig = {
  github: {
    servers: GitHubServer[];
  };
};

/**
 * API key storage for a specific server
 */
export interface GitHubServerToken {
  /** Server ID */
  serverId: string;
  /** Personal access token for this server */
  token: string;
}

/**
 * GitHub tokens configuration
 */
export interface GitHubTokensConfiguration {
  /** List of API tokens for each server */
  tokens: GitHubServerToken[];
  /** ID of the currently active server */
  activeServerId?: string;
}
