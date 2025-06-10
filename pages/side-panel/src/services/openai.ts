// OpenAI API integration for PR checklist generation
import type { PRData, PRFile, Checklist } from '@src/types';
import { OpenAI } from 'openai';
import type { ModelClient } from './modelClient';
import { geminiApiKeyStorage, openaiApiKeyStorage, type Language } from '@extension/storage';
import { buildPRAnalysisPrompt } from './modelClient';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  apiEndpoint?: string;
}

class OpenAIClient implements ModelClient {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint,
      dangerouslyAllowBrowser: true, // Add this flag to allow browser usage
    });
    this.model = config.model || 'gpt-4-turbo';
  }

  /**
   * Analyze a PR and generate checklist and summary
   */
  async analyzePR(prData: PRData, file: PRFile, language: Language): Promise<Checklist> {
    try {
      const prompt = buildPRAnalysisPrompt(prData, file, language);
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response) as Checklist;
    } catch (error) {
      console.error('Error analyzing PR with OpenAI:', error);
      throw new Error('Failed to analyze PR with OpenAI');
    }
  }

  /**
   * Make the API call to OpenAI
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
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
        response_format: { type: 'json_object' },
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
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
      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages,
          temperature: 0.3,
          stream: true,
          response_format: { type: 'text' }, // JSONでなくtextで返す
        },
        { signal: options?.signal },
      );
      for await (const chunk of response) {
        const delta = chunk.choices?.[0]?.delta?.content;
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
    apiEndpoint: import.meta.env.VITE_OPENAI_API_ENDPOINT,
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
    apiEndpoint: import.meta.env.VITE_GEMINI_API_ENDPOINT,
  });
};

export default OpenAIClient;
