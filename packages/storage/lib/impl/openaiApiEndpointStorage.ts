// OpenAI APIエンドポイント用ストレージユーティリティ
export const openaiApiEndpointStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('openaiApiEndpoint');
      return result.openaiApiEndpoint || '';
    } catch (error) {
      console.error('Error getting OpenAI API endpoint:', error);
      return '';
    }
  },

  set: async (endpoint: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ openaiApiEndpoint: endpoint });
    } catch (error) {
      console.error('Error setting OpenAI API endpoint:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('openaiApiEndpoint');
    } catch (error) {
      console.error('Error clearing OpenAI API endpoint:', error);
      throw error;
    }
  },
};
