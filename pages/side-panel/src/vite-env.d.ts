/// <reference types="vite/client" />

// ビルド時に注入されるGitHub設定の型定義
import type { GitHubConfig } from '@extension/storage/types/githubConfig';
declare const __GITHUB_CONFIG__: GitHubConfig;

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
import type { LlmConfig } from '@extension/storage/types/llmConfig';
declare const __LLM_CONFIG__: LlmConfig;
