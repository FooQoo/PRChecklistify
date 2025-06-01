// Gemini API integration for PR checklist generation
import type { PRData, PRFile, FileChecklist } from '@src/types';
import { GoogleGenAI, Type } from '@google/genai';
import { buildPRAnalysisPrompt, type ModelClient } from './modelClient';
import type { Language } from '@extension/storage';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

class GeminiClient implements ModelClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(config: GeminiConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-2.0-flash';
  }

  /**
   * Analyze a PR and generate checklist and summary
   */
  async analyzePR(prData: PRData, file: PRFile, language: Language): Promise<FileChecklist> {
    try {
      console.log(`Using language for analysis: ${language}`);
      const prompt = buildPRAnalysisPrompt(prData, file, language);
      const response = await this.callGemini(prompt);
      return JSON.parse(response) as FileChecklist;
    } catch (error) {
      console.error('Error analyzing PR with Gemini:', error);
      throw new Error('Failed to analyze PR with Gemini');
    }
  }

  /**
   * Make the API call to Gemini
   */
  private async callGemini(prompt: string): Promise<string> {
    try {
      const systemPrompt =
        'You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback in JSON format as requested.';
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING },
          explanation: { type: Type.STRING },
          checklistItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                description: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['OK', 'WARNING', 'ERROR', 'PENDING'] },
              },
              propertyOrdering: ['id', 'description', 'status'],
              required: ['id', 'description', 'status'],
            },
          },
        },
        required: ['filename', 'explanation', 'checklistItems'],
        propertyOrdering: ['filename', 'explanation', 'checklistItems'],
      };

      const result = await this.client.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        },
      });

      console.info('Gemini response:', result.text);

      return result.text || '';
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Stream chat completion from Gemini (for real-time chat UI)
   */
  async streamChatCompletion(
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
  ): Promise<void> {
    try {
      // 会話履歴を構築
      const chatHistory = [];
      let systemInstruction = undefined;

      // システムメッセージを最初に追加
      for (const message of messages) {
        if (message.role === 'system') {
          systemInstruction = { role: 'system', parts: [{ text: message.content }] };
        } else if (message.role === 'user') {
          chatHistory.push({ role: 'user', parts: [{ text: message.content }] });
        } else if (message.role === 'assistant') {
          chatHistory.push({ role: 'model', parts: [{ text: message.content }] });
        }
      }

      console.info('Streaming Gemini chat completion with history:', messages);

      const response = await this.client.models.generateContentStream({
        model: this.model,
        contents: chatHistory,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) onToken(text);
      }
    } catch (error) {
      console.error('Error streaming Gemini chat completion:', error);
      throw error;
    }
  }
}

// Gemini API key storage
export const geminiApiKeyStorage = {
  get: async (): Promise<string | null> => {
    try {
      const result = await chrome.storage.local.get('geminiApiKey');
      return result.geminiApiKey || null;
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return null;
    }
  },
  set: async (apiKey: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ geminiApiKey: apiKey });
    } catch (error) {
      console.error('Error setting Gemini API key:', error);
      throw error;
    }
  },
  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('geminiApiKey');
    } catch (error) {
      console.error('Error clearing Gemini API key:', error);
      throw error;
    }
  },
};

// Create and export Gemini client instance
export const createGeminiClient = async (): Promise<GeminiClient> => {
  const apiKey = await geminiApiKeyStorage.get();
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }
  return new GeminiClient({
    apiKey,
    model: 'gemini-1.5-pro',
  });
};

export default GeminiClient;
