export interface GitLabServer {
  id: string;
  name: string;
  apiUrl: string;
  webUrl: string;
}

export interface GitLabServerToken {
  serverId: string;
  token: string;
}

export interface GitLabTokensConfiguration {
  tokens: GitLabServerToken[];
  activeServerId?: string;
}
