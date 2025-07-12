/* eslint-disable no-useless-catch */
// Claude API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateObject } from 'ai';
import type { ModelClient } from './modelClient';
import { claudeApiKeyStorage, claudeModelStorage, type Language } from '@extension/storage';
import { buildPRAnalysisPrompt, ChecklistSchema, SYSTEM_PROMPT } from './modelClient';

export interface ClaudeConfig {
  apiKey: string;
  model: string;
}

class ClaudeClient implements ModelClient {
  private client: ReturnType<typeof createAnthropic>;
  private model: string;

  constructor(config: ClaudeConfig) {
    this.client = createAnthropic({
      apiKey: config.apiKey,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('Failed to analyze PR with Claude');
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

// Create and export Claude client instance
export const createClaudeClient = async (): Promise<ClaudeClient> => {
  const apiKey = await claudeApiKeyStorage.get();
  if (!apiKey) {
    throw new Error('Claude API key not found');
  }

  const model = await claudeModelStorage.get();
  return new ClaudeClient({
    apiKey,
    model,
  });
};

export default ClaudeClient;
