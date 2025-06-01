// Gemini API integration for PR checklist generation
import type { PRAnalysisResult, PRData, PRFile, ChecklistItemStatus } from '@src/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPRAnalysisPrompt, type ModelClient } from './modelClient';
import type { Language } from '@extension/storage';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

class GeminiClient implements ModelClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: GeminiConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-1.5-pro';
  }

  /**
   * Analyze a PR and generate checklist and summary
   */
  async analyzePR(prData: PRData, file: PRFile, language: Language): Promise<PRAnalysisResult> {
    try {
      console.log(`Using language for analysis: ${language}`);
      const prompt = buildPRAnalysisPrompt(prData, file, language);
      const response = await this.callGemini(prompt);
      return this.parseAnalysisResponse(prompt, response);
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
      const generativeModel = this.client.getGenerativeModel({ model: this.model });

      // Systemプロンプトと本文を一緒に送信
      const systemPrompt =
        'You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback in JSON format as requested.';
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const result = await generativeModel.generateContent(fullPrompt);
      return result.response.text();
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
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    try {
      // Gemini用のモデルを取得
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.3,
        },
      });

      // システムメッセージとユーザーメッセージを抽出
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      const userMessages = messages.filter(msg => msg.role === 'user').map(msg => msg.content);
      const assistantMessages = messages.filter(msg => msg.role === 'assistant').map(msg => msg.content);

      // 会話履歴を構築
      const chatHistory = [];
      const maxMessages = Math.max(userMessages.length, assistantMessages.length);

      for (let i = 0; i < maxMessages - 1; i++) {
        if (i < userMessages.length - 1) {
          chatHistory.push({ role: 'user', parts: [{ text: userMessages[i] }] });
        }
        if (i < assistantMessages.length) {
          chatHistory.push({ role: 'model', parts: [{ text: assistantMessages[i] }] });
        }
      }

      // 最後のユーザーメッセージ
      const lastUserMessage = userMessages[userMessages.length - 1];

      let result;
      if (chatHistory.length > 0) {
        // 会話履歴がある場合はチャットを開始
        const chat = generativeModel.startChat({
          history: chatHistory,
          systemInstruction: systemMessage,
        });

        const streamOptions = options?.signal ? { signal: options.signal } : undefined;
        result = await chat.sendMessageStream(lastUserMessage, streamOptions);
      } else {
        // 会話履歴がない場合は単一のリクエスト
        let content = lastUserMessage;
        if (systemMessage) {
          content = `${systemMessage}\n\n${content}`;
        }

        const streamOptions = options?.signal ? { signal: options.signal } : undefined;
        result = await generativeModel.generateContentStream(content, streamOptions);
      }

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) onToken(text);
      }
    } catch (error) {
      console.error('Error streaming Gemini chat completion:', error);
      throw error;
    }
  }

  /**
   * Parse the Gemini response into a structured format
   */
  private parseAnalysisResponse(prompt: string, responseText: string): PRAnalysisResult {
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText) as {
        summary: string;
        fileAnalysis: Array<{
          id?: string;
          filename: string;
          explanation: string;
          checklistItems: Array<{ id?: string; description: string; status?: string }>;
          order: number;
        }>;
      };

      // マッピング関数を作成して文字列からChecklistItemStatusに変換
      const mapStatus = (status?: string): ChecklistItemStatus => {
        if (status === 'OK' || status === 'WARNING' || status === 'ERROR' || status === 'PENDING') {
          return status as ChecklistItemStatus;
        }
        return 'PENDING';
      };

      // Ensure all file checklist items have IDs
      const fileAnalysis = parsedResponse.fileAnalysis.map((fileChecklist, fileIndex) => ({
        id: fileChecklist.id || `file-${fileIndex}`,
        filename: fileChecklist.filename,
        explanation: fileChecklist.explanation,
        checklistItems: fileChecklist.checklistItems.map((item, index) => ({
          id: item.id || `${fileChecklist.filename}-item-${index}`,
          description: item.description,
          status: mapStatus(item.status),
        })),
        order: fileChecklist.order,
      }));

      return {
        summary: parsedResponse.summary,
        fileAnalysis: fileAnalysis,
        prompt: prompt + '\n\nFinally, you should format the JSON output in a human-readable way.',
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse Gemini response');
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
