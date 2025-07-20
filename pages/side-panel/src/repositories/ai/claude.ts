// Claude API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateObject } from 'ai';
import type { ModelClient } from './modelClient';
import { claudeApiKeyStorage, claudeModelStorage, type Language } from '@extension/storage';
import { buildPRAnalysisPrompt, ChecklistSchema, SYSTEM_PROMPT, handleLLMError } from './modelClient';
import { LLMError } from '@src/errors/LLMError';

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  endpoint?: string;
}

class ClaudeClient implements ModelClient {
  private client: ReturnType<typeof createAnthropic>;
  private model: string;

  constructor(config: ClaudeConfig) {
    this.client = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.endpoint,
      headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
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
   * Stream chat completion from Claude (for real-time chat UI)
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

// Create and export Claude client instance
export const createClaudeClient = async (endpoint?: string): Promise<ClaudeClient> => {
  const apiKey = await claudeApiKeyStorage.get();
  if (!apiKey) {
    throw LLMError.createApiKeyNotFoundError();
  }

  const model = await claudeModelStorage.get();
  return new ClaudeClient({
    apiKey,
    model,
    endpoint,
  });
};

export default ClaudeClient;
