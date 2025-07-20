/**
 * PRファイル毎のチャット履歴を管理するサービス
 * prChatHistoryキーで独立してストレージに保存
 */

export type ChatMessage = {
  sender: string;
  message: string;
};

export type FileChatHistories = Record<string, ChatMessage[]>;

export type PRChatHistoryData = Record<string, ChatMessage[]>; // [prKey/filePath]: ChatMessage[]

/**
 * PRチャット履歴専用のストレージクラス
 */
class PRChatHistoryStorage {
  private readonly STORAGE_KEY = 'prChatHistory';

  /**
   * prKey + ファイルパスから一意のキーを生成
   */
  private generateChatKey(prKey: string, filePath: string): string {
    return `${prKey}/${filePath}`;
  }

  /**
   * 全てのチャット履歴データを取得
   */
  private async getAllChatHistories(): Promise<PRChatHistoryData> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || {};
    } catch (error) {
      console.error('Failed to get chat histories:', error);
      return {};
    }
  }

  /**
   * 特定のPRのファイル別チャット履歴を保存
   */
  async saveFileChatHistories(prKey: string, fileChatHistories: FileChatHistories): Promise<void> {
    try {
      const allHistories = await this.getAllChatHistories();

      // 既存の当該PR関連のエントリーを削除
      Object.keys(allHistories).forEach(key => {
        if (key.startsWith(`${prKey}/`)) {
          delete allHistories[key];
        }
      });

      // 新しいデータを追加
      Object.entries(fileChatHistories).forEach(([filePath, messages]) => {
        if (messages && messages.length > 0) {
          const chatKey = this.generateChatKey(prKey, filePath);
          allHistories[chatKey] = messages;
        }
      });

      await chrome.storage.local.set({ [this.STORAGE_KEY]: allHistories });
    } catch (error) {
      console.error('Failed to save file chat histories:', error);
      throw error;
    }
  }

  /**
   * 特定のPRのファイル別チャット履歴を取得
   */
  async getFileChatHistories(prKey: string): Promise<FileChatHistories> {
    try {
      const allHistories = await this.getAllChatHistories();
      const result: FileChatHistories = {};

      Object.entries(allHistories).forEach(([chatKey, messages]) => {
        if (chatKey.startsWith(`${prKey}/`)) {
          result[chatKey] = messages;
        }
      });

      return result;
    } catch (error) {
      console.error('Failed to get file chat histories:', error);
      return {};
    }
  }

  /**
   * 特定のファイルのチャット履歴を保存
   */
  async saveSingleFileChatHistory(prKey: string, filePath: string, messages: ChatMessage[]): Promise<void> {
    try {
      const allHistories = await this.getAllChatHistories();
      const chatKey = this.generateChatKey(prKey, filePath);

      if (messages && messages.length > 0) {
        allHistories[chatKey] = messages;
      } else {
        // 空の場合は削除
        delete allHistories[chatKey];
      }

      await chrome.storage.local.set({ [this.STORAGE_KEY]: allHistories });
    } catch (error) {
      console.error('Failed to save single file chat history:', error);
      throw error;
    }
  }

  /**
   * 特定のファイルのチャット履歴を取得
   */
  async getSingleFileChatHistory(prKey: string, filePath: string): Promise<ChatMessage[]> {
    try {
      const allHistories = await this.getAllChatHistories();
      const chatKey = this.generateChatKey(prKey, filePath);
      return allHistories[chatKey] || [];
    } catch (error) {
      console.error('Failed to get single file chat history:', error);
      return [];
    }
  }

  /**
   * 特定のPRの全チャット履歴を削除
   */
  async clearPRChatHistories(prKey: string): Promise<void> {
    try {
      const allHistories = await this.getAllChatHistories();

      // 当該PR関連のエントリーを削除
      Object.keys(allHistories).forEach(key => {
        if (key.startsWith(`${prKey}/`)) {
          delete allHistories[key];
        }
      });

      await chrome.storage.local.set({ [this.STORAGE_KEY]: allHistories });
    } catch (error) {
      console.error('Failed to clear PR chat histories:', error);
      throw error;
    }
  }

  /**
   * 全てのチャット履歴を削除
   */
  async clearAllChatHistories(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear all chat histories:', error);
      throw error;
    }
  }

  /**
   * ストレージ統計情報を取得
   */
  async getStorageStats(): Promise<{ totalEntries: number; totalSize: number }> {
    try {
      const allHistories = await this.getAllChatHistories();
      const totalEntries = Object.keys(allHistories).length;
      const totalSize = JSON.stringify(allHistories).length;

      return { totalEntries, totalSize };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

// シングルトンインスタンスをエクスポート
export const prChatHistoryStorage = new PRChatHistoryStorage();
