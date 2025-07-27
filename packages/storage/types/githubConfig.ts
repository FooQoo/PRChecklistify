// GitHubConfig型定義
export type GitHubConfig = {
  github: {
    servers: Array<{
      id: string;
      name: string;
      apiUrl: string;
      webUrl: string;
    }>;
  };
};
