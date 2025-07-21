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

declare const __GITLAB_CONFIG__: {
  gitlab: {
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

// ビルド時に注入されるLLMサービス設定の型定義
declare const __LLM_CONFIG__: {
  llmServices: {
    providers: Array<{
      id: string;
      name: string;
      apiEndpoint: string;
      tokenRegistrationUrl: string;
      defaultModel: string;
      models: Array<{
        id: string;
        name: string;
        maxTokens: number;
      }>;
    }>;
  };
};
