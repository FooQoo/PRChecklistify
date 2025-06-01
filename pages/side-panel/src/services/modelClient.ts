// Common interface for LLM clients (OpenAI, Gemini, etc.)
import type { PRAnalysisResult, PRData } from '@src/types';

// ModelClientType for selecting the appropriate LLM service
export enum ModelClientType {
  OpenAI = 'openai',
  Gemini = 'gemini',
}

// Common interface for all LLM clients
export interface ModelClient {
  analyzePR(prData: PRData, languageOverride?: string): Promise<PRAnalysisResult>;
  streamChatCompletion(
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
}

// Factory function to create appropriate client
import { createOpenAIClient } from './openai';
import { createGeminiClient } from './gemini';

// Storage for model client type preference
export const modelClientTypeStorage = {
  get: async (): Promise<ModelClientType | null> => {
    try {
      const result = await chrome.storage.local.get('modelClientType');
      return (result.modelClientType as ModelClientType) || null;
    } catch (error) {
      console.error('Error getting model client type preference:', error);
      return null;
    }
  },

  set: async (clientType: ModelClientType): Promise<void> => {
    try {
      await chrome.storage.local.set({ modelClientType: clientType });
    } catch (error) {
      console.error('Error setting model client type preference:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('modelClientType');
    } catch (error) {
      console.error('Error clearing model client type preference:', error);
      throw error;
    }
  },
};

export async function createModelClient(): Promise<ModelClient | null> {
  // Get the preferred client type from storage, default to OpenAI if not set
  const clientType = (await modelClientTypeStorage.get()) || ModelClientType.OpenAI;

  switch (clientType) {
    case ModelClientType.OpenAI:
      return await createOpenAIClient();
    case ModelClientType.Gemini:
      return await createGeminiClient();
    default:
      console.error(`Unknown model client type: ${clientType}`);
      return null;
  }
}
