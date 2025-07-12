/* eslint-disable no-useless-catch */
// OpenAI API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateObject } from 'ai';
import type { ModelClient } from './modelClient';
import { openaiApiKeyStorage, openaiModelStorage, type Language } from '@extension/storage';
import { buildPRAnalysisPrompt, ChecklistSchema, SYSTEM_PROMPT } from './modelClient';

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('Failed to analyze PR with OpenAI');
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
      const stream = await streamText({
        model,
        messages,
        temperature: 0.3,
        abortSignal: options?.signal,
      });

      for await (const delta of stream.textStream) {
        if (delta) onToken(delta);
      }
    } catch (error) {
      throw error;
    }
  }
}

// Create and export OpenAI client instance
export const createOpenAIClient = async (): Promise<OpenAIClient> => {
  const apiKey = await openaiApiKeyStorage.get();
  if (!apiKey) {
    throw new Error('Failed to retrieve OpenAI API key');
  }

  const model = await openaiModelStorage.get();
  return new OpenAIClient({
    apiKey,
    model,
  });
};

export default OpenAIClient;
