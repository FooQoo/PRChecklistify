/**
 * Storage utility for MCP JSON config
 */
export const mcpJsonStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('mcpJsonConfig');
      return result.mcpJsonConfig || '';
    } catch (error) {
      console.error('Error getting MCP JSON config:', error);
      return '';
    }
  },

  set: async (json: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ mcpJsonConfig: json });
    } catch (error) {
      console.error('Error setting MCP JSON config:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('mcpJsonConfig');
    } catch (error) {
      console.error('Error clearing MCP JSON config:', error);
      throw error;
    }
  },
};
