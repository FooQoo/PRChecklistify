/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Storage utility for Gemini API key
 */
export const geminiApiKeyStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('geminiApiKey');
      return result.geminiApiKey || '';
    } catch (error) {
      return '';
    }
  },

  set: async (apiKey: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ geminiApiKey: apiKey });
    } catch (error) {
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('geminiApiKey');
    } catch (error) {
      throw error;
    }
  },
};
