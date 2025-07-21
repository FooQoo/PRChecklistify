import { prChatHistoryDataStorage, type ChatMessage, type FileChatHistories } from '@extension/storage';

export type { ChatMessage, FileChatHistories };

/**
 * Repository for PR chat history storage operations
 * Simple data access layer - key generation and CRUD operations only
 */
export class PRChatHistoryRepository {
  /**
   * Generate unique key for chat history
   */
  private generateChatKey(prKey: string, filePath: string): string {
    return `${prKey}/${filePath}`;
  }

  /**
   * Save single file chat history
   */
  async saveSingleFileChatHistory(prKey: string, filePath: string, messages: ChatMessage[]): Promise<void> {
    const allHistories = await prChatHistoryDataStorage.get();
    const chatKey = this.generateChatKey(prKey, filePath);

    if (messages && messages.length > 0) {
      allHistories[chatKey] = messages;
    } else {
      // 空の場合は削除
      delete allHistories[chatKey];
    }

    await prChatHistoryDataStorage.set(allHistories);
  }

  /**
   * Get single file chat history
   */
  async getSingleFileChatHistory(prKey: string, filePath: string): Promise<ChatMessage[]> {
    try {
      const allHistories = await prChatHistoryDataStorage.get();
      const chatKey = this.generateChatKey(prKey, filePath);
      return allHistories[chatKey] || [];
    } catch {
      return [];
    }
  }

  /**
   * Save multiple file chat histories for a PR
   */
  async saveFileChatHistories(prKey: string, fileChatHistories: FileChatHistories): Promise<void> {
    const allHistories = await prChatHistoryDataStorage.get();

    // 新しいデータを追加
    Object.entries(fileChatHistories).forEach(([filePath, messages]) => {
      if (messages && messages.length > 0) {
        const chatKey = this.generateChatKey(prKey, filePath);
        allHistories[chatKey] = messages;
      }
    });

    await prChatHistoryDataStorage.set(allHistories);
  }

  /**
   * Get all file chat histories for a PR
   */
  async getFileChatHistories(prKey: string): Promise<FileChatHistories> {
    try {
      const allHistories = await prChatHistoryDataStorage.get();
      const result: FileChatHistories = {};

      Object.entries(allHistories).forEach(([chatKey, messages]) => {
        if (chatKey.startsWith(`${prKey}/`)) {
          result[chatKey] = messages;
        }
      });

      return result;
    } catch {
      return {};
    }
  }

  /**
   * Remove all chat histories for a specific PR
   */
  async removePRChatHistories(prKey: string): Promise<void> {
    try {
      const allHistories = await prChatHistoryDataStorage.get();

      // 当該PR関連のエントリーを削除
      Object.keys(allHistories).forEach(key => {
        if (key.startsWith(`${prKey}/`)) {
          delete allHistories[key];
        }
      });

      await prChatHistoryDataStorage.set(allHistories);
    } catch {
      // エラーは無視
    }
  }

  /**
   * Remove chat histories for multiple PRs
   */
  async removePRChatHistoriesBatch(prKeys: string[]): Promise<void> {
    try {
      const allHistories = await prChatHistoryDataStorage.get();

      // 指定されたPR関連のエントリーを削除
      Object.keys(allHistories).forEach(key => {
        const prKey = key.split('/')[0];
        if (prKeys.includes(prKey)) {
          delete allHistories[key];
        }
      });

      await prChatHistoryDataStorage.set(allHistories);
    } catch {
      // エラーは無視
    }
  }

  /**
   * Clear all chat histories
   */
  async clearAllChatHistories(): Promise<void> {
    try {
      await prChatHistoryDataStorage.set({});
    } catch {
      // エラーは無視
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ totalEntries: number; totalSize: number }> {
    try {
      const allHistories = await prChatHistoryDataStorage.get();
      const totalEntries = Object.keys(allHistories).length;
      const totalSize = JSON.stringify(allHistories).length;

      return { totalEntries, totalSize };
    } catch {
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

// シングルトンインスタンスをエクスポート
export const prChatHistoryRepository = new PRChatHistoryRepository();
