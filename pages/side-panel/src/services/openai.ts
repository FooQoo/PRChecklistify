// OpenAI API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { ModelClient } from './modelClient';
import { geminiApiKeyStorage, openaiApiKeyStorage, type Language } from '@extension/storage';
import { buildPRAnalysisPrompt } from './modelClient';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  apiEndpoint?: string;
}

class OpenAIClient implements ModelClient {
  private client: ReturnType<typeof createOpenAI>;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint || '',
      compatibility: 'strict',
    });
    this.model = config.model;
  }

  /**
   * Analyze a PR and generate checklist and summary
   */
  async analyzePR(prData: PRData, file: PRFile, language: Language): Promise<Checklist> {
    try {
      const prompt = buildPRAnalysisPrompt(prData, file, language);
      const model = this.client.languageModel(this.model as string);
      const response = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback in JSON format as requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });
      return JSON.parse(response.text) as Checklist;
    } catch (error) {
      console.error('Error analyzing PR with OpenAI:', error);
      throw new Error('Failed to analyze PR with OpenAI');
    }
  }

  /**
   * Stream chat completion from OpenAI (for real-time chat UI)
   */
  async streamChatCompletion(
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
  ): Promise<void> {
    try {
      const model = this.client.languageModel(this.model as string);
      const stream = await streamText({
        model,
        messages,
        temperature: 0.3,
      });
      for await (const delta of stream.textStream) {
        if (delta) onToken(delta);
      }
    } catch (error) {
      console.error('Error streaming OpenAI chat completion:', error);
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
  return new OpenAIClient({
    apiKey,
    model: 'gpt-4o',
    apiEndpoint: 'https://api.openai.com/v1',
  });
};

export const createGeminiClient = async (): Promise<OpenAIClient> => {
  const apiKey = await geminiApiKeyStorage.get();
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }
  return new OpenAIClient({
    apiKey,
    model: 'gemini-1.5-pro',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
  });
};

export default OpenAIClient;
