export const geminiModelStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('geminiModel');
      return result.geminiModel || 'gemini-1.5-pro';
    } catch (error) {
      console.error('Error getting Gemini model:', error);
      return 'gemini-1.5-pro';
    }
  },
  set: async (model: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ geminiModel: model });
    } catch (error) {
      console.error('Error setting Gemini model:', error);
      throw error;
    }
  },
  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ geminiModel: 'gemini-1.5-pro' });
    } catch (error) {
      console.error('Error clearing Gemini model:', error);
      throw error;
    }
  },
};
