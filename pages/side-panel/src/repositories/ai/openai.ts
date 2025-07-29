// OpenAI API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateObject } from 'ai';
import type { ModelClient } from './modelClient';
import {
  openaiApiKeyStorage,
  openaiModelStorage,
  aiEndpointStorage,
  ModelClientType,
  type Language,
} from '@extension/storage';
import { buildPRAnalysisPrompt, ChecklistSchema, SYSTEM_PROMPT, handleLLMError } from './modelClient';
import { LLMError } from '@src/errors/LLMError';

export interface OpenAIConfig {
  apiKey: string;
  endpoint?: string;
  model: string;
}

class OpenAIClient implements ModelClient {
  private client: ReturnType<typeof createOpenAI>;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = createOpenAI({
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
      const model = this.client.languageModel(this.model);

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
   * Stream chat completion from OpenAI (for real-time chat UI)
   */
  async streamChatCompletion(
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    try {
      const model = this.client.languageModel(this.model);
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

// Create and export OpenAI client instance
export const createOpenAIClient = async (): Promise<OpenAIClient> => {
  const apiKey = await openaiApiKeyStorage.get();
  if (!apiKey) {
    throw LLMError.createApiKeyNotFoundError();
  }

  const model = await openaiModelStorage.get();
  const endpoint = await aiEndpointStorage.getEndpoint(ModelClientType.OpenAI);

  return new OpenAIClient({
    apiKey,
    model,
    endpoint,
  });
};

export default OpenAIClient;
