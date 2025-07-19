// Gemini API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateObject } from 'ai';
import type { ModelClient } from './modelClient';
import { geminiApiKeyStorage, geminiModelStorage, type Language } from '@extension/storage';
import { buildPRAnalysisPrompt, ChecklistSchema, SYSTEM_PROMPT } from './modelClient';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  endpoint?: string;
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('Failed to analyze PR with Gemini');
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
    // eslint-disable-next-line no-useless-catch
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

// Create and export Gemini client instance
export const createGeminiClient = async (endpoint?: string): Promise<GeminiClient> => {
  const apiKey = await geminiApiKeyStorage.get();
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const model = await geminiModelStorage.get();
  return new GeminiClient({
    apiKey,
    model,
    endpoint,
  });
};

export default GeminiClient;
