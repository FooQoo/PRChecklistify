export interface GitHubProfile {
  name: string;
  apiDomain: string;
  webDomain: string;
  apiVersion: string;
}

export interface GitHubEnterpriseConfig {
  profiles: Record<string, GitHubProfile>;
}
