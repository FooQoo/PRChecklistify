/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import { Runtime } from 'webextension-polyfill';

/**
 * Storage utility for OpenAI API key
 */
export const openaiApiKeyStorage = {
  get: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get('openaiApiKey');
      return result.openaiApiKey || '';
    } catch (error) {
      return '';
    }
  },

  set: async (apiKey: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
    } catch (error) {
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('openaiApiKey');
    } catch (error) {
      throw error;
    }
  },
};
