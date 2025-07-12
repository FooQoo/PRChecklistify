export const openaiModelStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('openaiModel');
      return result.openaiModel || 'gpt-4o';
    } catch (error) {
      console.error('Error getting OpenAI model:', error);
      return 'gpt-4o';
    }
  },
  set: async (model: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ openaiModel: model });
    } catch (error) {
      console.error('Error setting OpenAI model:', error);
      throw error;
    }
  },
  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ openaiModel: 'gpt-4o' });
    } catch (error) {
      console.error('Error clearing OpenAI model:', error);
      throw error;
    }
  },
};
