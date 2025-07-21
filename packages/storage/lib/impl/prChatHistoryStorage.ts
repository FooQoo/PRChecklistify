import { createStorage } from '../base/base.js';
import type { PRChatHistoryData } from '../types/prData.js';

/**
 * Storage for PR chat history data
 */
export const prChatHistoryDataStorage = createStorage<PRChatHistoryData>(
  'prChatHistory',
  {},
  {
    serialization: {
      serialize: (value: PRChatHistoryData) => JSON.stringify(value),
      deserialize: (text: string) => {
        try {
          return JSON.parse(text) as PRChatHistoryData;
        } catch {
          return {};
        }
      },
    },
    liveUpdate: true,
  },
);
