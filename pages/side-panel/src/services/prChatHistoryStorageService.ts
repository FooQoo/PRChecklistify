/**
 * PRファイル毎のチャット履歴を管理するサービス
 * repository/storage の prChatHistoryRepository を使用してビジネスロジックを実装
 */

import {
  prChatHistoryRepository,
  type ChatMessage,
  type FileChatHistories,
} from '@src/repositories/storage/prChatHistoryRepository';

export type { ChatMessage, FileChatHistories };

/**
 * Service for managing PR chat history with business logic
 */
export class PRChatHistoryStorageService {
  /**
   * Save file chat histories for a specific PR
   */
  async saveFileChatHistories(prKey: string, fileChatHistories: FileChatHistories): Promise<void> {
    // 既存のPR関連チャット履歴をクリアしてから保存
    await prChatHistoryRepository.removePRChatHistories(prKey);
    return prChatHistoryRepository.saveFileChatHistories(prKey, fileChatHistories);
  }

  /**
   * Get file chat histories for a specific PR
   */
  async getFileChatHistories(prKey: string): Promise<FileChatHistories> {
    return prChatHistoryRepository.getFileChatHistories(prKey);
  }

  /**
   * Save single file chat history
   */
  async saveSingleFileChatHistory(prKey: string, filePath: string, messages: ChatMessage[]): Promise<void> {
    return prChatHistoryRepository.saveSingleFileChatHistory(prKey, filePath, messages);
  }

  /**
   * Get single file chat history
   */
  async getSingleFileChatHistory(prKey: string, filePath: string): Promise<ChatMessage[]> {
    return prChatHistoryRepository.getSingleFileChatHistory(prKey, filePath);
  }

  /**
   * Clear all chat histories for a specific PR
   */
  async clearPRChatHistories(prKey: string): Promise<void> {
    return prChatHistoryRepository.removePRChatHistories(prKey);
  }

  /**
   * Clear all chat histories
   */
  async clearAllChatHistories(): Promise<void> {
    return prChatHistoryRepository.clearAllChatHistories();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ totalEntries: number; totalSize: number }> {
    return prChatHistoryRepository.getStorageStats();
  }
}

// シングルトンインスタンスをエクスポート
export const prChatHistoryStorageService = new PRChatHistoryStorageService();
