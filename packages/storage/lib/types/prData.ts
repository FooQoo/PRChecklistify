/**
 * PR data related types for storage
 */

export type ChatMessage = {
  sender: string;
  message: string;
};

export type AllFileChatHistories = Record<string, ChatMessage[]>;

export type RecentPR = {
  title: string;
  key: string;
  timestamp: number;
};

export type PRDataCacheItem = {
  key: string;
  data: unknown; // Will be typed as PRData when imported from main app
  timestamp: number;
  analysisResult?: unknown; // Will be typed as PRAnalysisResult when imported from main app
};

export type PRDataCache = PRDataCacheItem[];

export type PRChatHistoryData = Record<string, ChatMessage[]>; // [prKey/filePath]: ChatMessage[]

export type FileChatHistories = Record<string, ChatMessage[]>;
