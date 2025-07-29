/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { AIEndpointConfig } from '../types/index.js';
import { DEFAULT_AI_ENDPOINT_CONFIG, DEFAULT_AI_ENDPOINTS } from '../types/aiEndpointConfig.js';
import type { ModelClientType } from './modelClientTypeStorage.js';

/**
 * Storage utility for AI API endpoints configuration
 */
export const aiEndpointStorage = {
  get: async (): Promise<AIEndpointConfig> => {
    try {
      const result = await chrome.storage.local.get('aiEndpointConfig');
      return result.aiEndpointConfig || DEFAULT_AI_ENDPOINT_CONFIG;
    } catch (error) {
      return DEFAULT_AI_ENDPOINT_CONFIG;
    }
  },

  set: async (config: AIEndpointConfig): Promise<void> => {
    try {
      const updatedConfig = {
        ...config,
        lastUpdated: Date.now(),
      };
      await chrome.storage.local.set({ aiEndpointConfig: updatedConfig });
    } catch (error) {
      throw error;
    }
  },

  updateEndpoint: async (providerId: ModelClientType, endpoint: string): Promise<void> => {
    try {
      const currentConfig = await aiEndpointStorage.get();
      const endpointKey = `${providerId}ApiEndpoint` as keyof AIEndpointConfig;

      const updatedConfig: AIEndpointConfig = {
        ...currentConfig,
        [endpointKey]: endpoint,
        lastUpdated: Date.now(),
      };

      await chrome.storage.local.set({ aiEndpointConfig: updatedConfig });
    } catch (error) {
      throw error;
    }
  },

  resetEndpoint: async (providerId: ModelClientType): Promise<void> => {
    try {
      const currentConfig = await aiEndpointStorage.get();
      const endpointKey = `${providerId}ApiEndpoint` as keyof AIEndpointConfig;
      const defaultEndpoint = DEFAULT_AI_ENDPOINTS[providerId];

      const updatedConfig: AIEndpointConfig = {
        ...currentConfig,
        [endpointKey]: defaultEndpoint,
        lastUpdated: Date.now(),
      };

      await chrome.storage.local.set({ aiEndpointConfig: updatedConfig });
    } catch (error) {
      throw error;
    }
  },

  getEndpoint: async (providerId: ModelClientType): Promise<string> => {
    try {
      const config = await aiEndpointStorage.get();
      const endpointKey = `${providerId}ApiEndpoint` as keyof AIEndpointConfig;
      return config[endpointKey] as string;
    } catch (error) {
      return DEFAULT_AI_ENDPOINTS[providerId];
    }
  },

  clear: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('aiEndpointConfig');
    } catch (error) {
      throw error;
    }
  },
};
