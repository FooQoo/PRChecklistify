export const claudeApiKeyStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('claudeApiKey');
      return result.claudeApiKey || '';
    } catch (error) {
      console.error('Error getting Claude API key:', error);
      return '';
    }
  },

  set: async (apiKey: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ claudeApiKey: apiKey });
    } catch (error) {
      console.error('Error setting Claude API key:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('claudeApiKey');
    } catch (error) {
      console.error('Error clearing Claude API key:', error);
      throw error;
    }
  },
};
