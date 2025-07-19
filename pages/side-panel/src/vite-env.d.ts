/// <reference types="vite/client" />

// ビルド時に注入されるGitHub設定の型定義
declare const __GITHUB_CONFIG__: {
  github: {
    servers: Array<{
      id: string;
      name: string;
      apiUrl: string;
      webUrl: string;
    }>;
  };
};
