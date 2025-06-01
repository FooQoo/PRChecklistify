/**
 * Storage utility for Gemini API key
 */
export const geminiApiKeyStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('geminiApiKey');
      return result.geminiApiKey || '';
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return '';
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
