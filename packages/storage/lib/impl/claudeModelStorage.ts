export const claudeModelStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('claudeModel');
      return result.claudeModel || 'claude-3-opus-20240229';
    } catch (error) {
      console.error('Error getting Claude model:', error);
      return 'claude-3-opus-20240229';
    }
  },
  set: async (model: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ claudeModel: model });
    } catch (error) {
      console.error('Error setting Claude model:', error);
      throw error;
    }
  },
  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ claudeModel: 'claude-3-opus-20240229' });
    } catch (error) {
      console.error('Error clearing Claude model:', error);
      throw error;
    }
  },
};
