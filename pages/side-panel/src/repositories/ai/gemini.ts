// Gemini API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateObject } from 'ai';
import type { ModelClient } from './modelClient';
import {
  geminiApiKeyStorage,
  geminiModelStorage,
  aiEndpointStorage,
  ModelClientType,
  type Language,
} from '@extension/storage';
import { buildPRAnalysisPrompt, ChecklistSchema, SYSTEM_PROMPT, handleLLMError } from './modelClient';
import { LLMError } from '@src/errors/LLMError';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

class GeminiClient implements ModelClient {
  private client: ReturnType<typeof createGoogleGenerativeAI>;
  private model: string;

  constructor(config: GeminiConfig) {
    this.client = createGoogleGenerativeAI({
      apiKey: config.apiKey,
      baseURL: config.endpoint,
    });
    this.model = config.model;
  }

  /**
   * Analyze a PR and generate checklist and summary
   */
  async analyzePR(prData: PRData, file: PRFile, language: Language): Promise<Checklist> {
    try {
      const prompt = buildPRAnalysisPrompt(prData, file, language);
      const model = this.client(this.model);

      const { object } = await generateObject({
        model,
        schema: ChecklistSchema,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      return object as Checklist;
    } catch (error) {
      handleLLMError(error);
    }
  }

  /**
   * Stream chat completion from Gemini (for real-time chat UI)
   */
  async streamChatCompletion(
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    try {
      const model = this.client(this.model);

      const { fullStream } = streamText({
        model,
        messages,
        temperature: 0.3,
        abortSignal: options?.signal,
      });

      for await (const part of fullStream) {
        switch (part.type) {
          case 'text-delta': {
            if (part.textDelta) onToken(part.textDelta);
            break;
          }

          case 'error': {
            const error = part.error;
            handleLLMError(error);
          }
        }
      }
    } catch (error) {
      if (LLMError.isLLMError(error)) {
        throw error; // Re-throw LLMError for consistent handling
      }
      handleLLMError(error);
    }
  }
}

// Create and export Gemini client instance
export const createGeminiClient = async (): Promise<GeminiClient> => {
  const apiKey = await geminiApiKeyStorage.get();
  if (!apiKey) {
    throw LLMError.createApiKeyNotFoundError();
  }

  const model = await geminiModelStorage.get();
  const endpoint = await aiEndpointStorage.getEndpoint(ModelClientType.Gemini);

  return new GeminiClient({
    apiKey,
    model,
    endpoint,
  });
};

export default GeminiClient;
