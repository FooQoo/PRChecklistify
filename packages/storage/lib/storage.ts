// Storage utilities for the extension
// import { runtime } from 'webextension-polyfill';

/**
 * Storage utility for GitHub token
 */
export const githubTokenStorage = {
  get: async (): Promise<string> => {
    const result = await chrome.storage.local.get('githubToken');
    return result.githubToken || '';
  },

  set: async (token: string): Promise<void> => {
    await chrome.storage.local.set({ githubToken: token });
  },

  clear: async (): Promise<void> => {
    await chrome.storage.local.remove('githubToken');
  },
};

/**
 * Storage utility for OpenAI API key
 */
export const openaiApiKeyStorage = {
  get: async (): Promise<string> => {
    const result = await chrome.storage.local.get('openaiApiKey');
    return result.openaiApiKey || '';
  },

  set: async (apiKey: string): Promise<void> => {
    await chrome.storage.local.set({ openaiApiKey: apiKey });
  },

  clear: async (): Promise<void> => {
    await chrome.storage.local.remove('openaiApiKey');
  },
};

export * from './impl/index.js';
export * from './types/index.js';

export default {
  githubTokenStorage,
  openaiApiKeyStorage,
};
