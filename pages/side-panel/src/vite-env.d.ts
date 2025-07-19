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

// ビルド時に注入されるFooter設定の型定義
declare const __FOOTER_CONFIG__: {
  footer: {
    author: {
      name: string;
      url: string;
    };
  };
};
