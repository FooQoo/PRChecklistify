export const claudeApiKeyStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('claudeApiKey');
      return result.claudeApiKey || '';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return '';
    }
  },

  set: async (apiKey: string): Promise<void> => {
    // eslint-disable-next-line no-useless-catch
    try {
      await chrome.storage.local.set({ claudeApiKey: apiKey });
    } catch (error) {
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    // eslint-disable-next-line no-useless-catch
    try {
      await chrome.storage.local.remove('claudeApiKey');
    } catch (error) {
      throw error;
    }
  },
};
