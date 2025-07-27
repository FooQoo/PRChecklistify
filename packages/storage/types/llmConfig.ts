// LlmConfig型定義
export type LlmConfig = {
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
