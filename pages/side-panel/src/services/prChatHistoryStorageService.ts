/**
 * PRファイル毎のチャット履歴を管理するサービス
 * 依存性注入によりリポジトリを受け取ってビジネスロジックを実装
 */

// 型定義のみをインポート（実装は注入により受け取る）
export interface ChatMessage {
  sender: string;
  message: string;
}

export interface FileChatHistories {
  [filePath: string]: ChatMessage[];
}

/**
 * Interface for PRChatHistoryRepository to enable dependency injection
 */
export interface IPRChatHistoryRepository {
  saveFileChatHistories: (prKey: string, fileChatHistories: FileChatHistories) => Promise<void>;
  getFileChatHistories: (prKey: string) => Promise<FileChatHistories>;
  saveSingleFileChatHistory: (prKey: string, filePath: string, messages: ChatMessage[]) => Promise<void>;
  getSingleFileChatHistory: (prKey: string, filePath: string) => Promise<ChatMessage[]>;
  removePRChatHistories: (prKey: string) => Promise<void>;
  removePRChatHistoriesBatch: (prKeys: string[]) => Promise<void>;
  clearAllChatHistories: () => Promise<void>;
  getStorageStats: () => Promise<{ totalEntries: number; totalSize: number }>;
}

/**
 * Service for managing PR chat history with business logic
 * 完全にDI（依存性注入）ベース - リポジトリは必須パラメータ
 */
export class PRChatHistoryStorageService {
  private repository: IPRChatHistoryRepository;

  constructor(repository: IPRChatHistoryRepository) {
    this.repository = repository;
  }

  /**
   * Create instance with dependency injection
   */
  static create(repository: IPRChatHistoryRepository): PRChatHistoryStorageService {
    return new PRChatHistoryStorageService(repository);
  }

  /**
   * Save file chat histories for a specific PR
   */
  async saveFileChatHistories(prKey: string, fileChatHistories: FileChatHistories): Promise<void> {
    // 既存のPR関連チャット履歴をクリアしてから保存
    await this.repository.removePRChatHistories(prKey);
    return this.repository.saveFileChatHistories(prKey, fileChatHistories);
  }

  /**
   * Get file chat histories for a specific PR
   */
  async getFileChatHistories(prKey: string): Promise<FileChatHistories> {
    return this.repository.getFileChatHistories(prKey);
  }

  /**
   * Save single file chat history
   */
  async saveSingleFileChatHistory(prKey: string, filePath: string, messages: ChatMessage[]): Promise<void> {
    return this.repository.saveSingleFileChatHistory(prKey, filePath, messages);
  }

  /**
   * Get single file chat history
   */
  async getSingleFileChatHistory(prKey: string, filePath: string): Promise<ChatMessage[]> {
    return this.repository.getSingleFileChatHistory(prKey, filePath);
  }

  /**
   * Clear all chat histories for a specific PR
   */
  async removePRChatHistories(prKey: string): Promise<void> {
    return this.repository.removePRChatHistories(prKey);
  }

  /**
   * Clear all chat histories
   */
  async clearAllChatHistories(): Promise<void> {
    return this.repository.clearAllChatHistories();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ totalEntries: number; totalSize: number }> {
    return this.repository.getStorageStats();
  }
}
