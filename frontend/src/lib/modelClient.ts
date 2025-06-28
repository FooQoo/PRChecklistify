import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// --- AI Model Client ---

type AIProvider = 'openai' | 'gemini';

function createOpenAIClient(): LanguageModel {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const client = createOpenAI({
    apiKey,
    compatibility: 'strict',
  });
  return client.languageModel('gpt-4o');
}

function createGeminiClient(): LanguageModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  const client = createOpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    compatibility: 'strict',
  });
  return client.languageModel('gemini-1.5-pro-latest');
}

/**
 * Creates an AI model client based on the AI_PROVIDER environment variable.
 * Defaults to 'gemini'.
 */
export function createModelClient(): LanguageModel {
  const provider = (process.env.AI_PROVIDER as AIProvider) || 'gemini';

  switch (provider) {
    case 'openai':
      console.log('Using OpenAI client.');
      return createOpenAIClient();
    case 'gemini':
      console.log('Using Gemini (OpenAI compatible) client.');
      return createGeminiClient();
    default:
      console.warn(`Unknown AI_PROVIDER "${provider}". Defaulting to Gemini.`);
      return createGeminiClient();
  }
}
