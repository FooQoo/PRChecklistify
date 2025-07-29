import type { ModelClientType } from '../impl/modelClientTypeStorage.js';

// AIエンドポイント設定の型定義
export interface AIEndpointConfig {
  openaiApiEndpoint: string;
  geminiApiEndpoint: string;
  claudeApiEndpoint: string;
  lastUpdated: number;
}

// プロバイダー別エンドポイント情報
export interface AIProviderEndpoint {
  id: ModelClientType;
  name: string;
  endpoint: string;
  defaultEndpoint: string;
  isCustom: boolean;
}

// デフォルトエンドポイント定数
export const DEFAULT_AI_ENDPOINTS: Record<ModelClientType, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  claude: 'https://api.anthropic.com/v1',
} as const;

// デフォルト設定
export const DEFAULT_AI_ENDPOINT_CONFIG: AIEndpointConfig = {
  openaiApiEndpoint: DEFAULT_AI_ENDPOINTS.openai,
  geminiApiEndpoint: DEFAULT_AI_ENDPOINTS.gemini,
  claudeApiEndpoint: DEFAULT_AI_ENDPOINTS.claude,
  lastUpdated: Date.now(),
};
