// 型定義のみを定義（実装は注入により受け取る）
export interface ChatMessage {
  sender: string;
  message: string;
}

export interface FileChatHistories {
  [filename: string]: ChatMessage[];
}

export interface RecentPR {
  key: string;
  title: string;
  timestamp: number;
}

// 必要な型のみをインポート
import type { PRData, SavedPRData, PRAnalysisResult } from '@src/types';

/**
 * Interface for PRDataRepository to enable dependency injection
 */
export interface IPRDataRepository {
  savePRDataItem: (prKey: string, prData: PRData, analysisResult?: PRAnalysisResult) => Promise<void>;
  updateAnalysisResult: (prKey: string, analysisResult: PRAnalysisResult) => Promise<void>;
  getPRData: (prKey: string) => Promise<SavedPRData | null>;
  getAllPRData: () => Promise<SavedPRData[]>;
  removePRData: (prKey: string) => Promise<void>;
  removePRDataBatch: (prKeys: string[]) => Promise<void>;
}

/**
 * Interface for PRChatHistoryRepository to enable dependency injection
 */
export interface IPRChatHistoryRepository {
  saveFileChatHistories: (prKey: string, histories: FileChatHistories) => Promise<void>;
  getFileChatHistories: (prKey: string) => Promise<FileChatHistories>;
  saveSingleFileChatHistory: (prKey: string, filePath: string, messages: ChatMessage[]) => Promise<void>;
  getSingleFileChatHistory: (prKey: string, filePath: string) => Promise<ChatMessage[]>;
  removePRChatHistories: (prKey: string) => Promise<void>;
  removePRChatHistoriesBatch: (prKeys: string[]) => Promise<void>;
  clearAllChatHistories: () => Promise<void>;
  getStorageStats: () => Promise<{ totalEntries: number; totalSize: number }>;
}

/**
 * Interface for RecentPRRepository to enable dependency injection
 */
export interface IRecentPRRepository {
  saveRecentPR: (prKey: string, title: string) => Promise<void>;
  getRecentPRs: () => Promise<RecentPR[]>;
  cleanupRecentPRs: (keepCount: number) => Promise<void>;
  removeRecentPR: (prKey: string) => Promise<void>;
  removeRecentPRsBatch: (prKeys: string[]) => Promise<void>;
}

/**
 * Service for managing PR data with business logic
 * 完全にDI（依存性注入）ベース - すべてのリポジトリは必須パラメータ
 * Handles cache size management, recent PRs cleanup, and coordinates with chat history
 */
export class PRDataStorageService {
  private readonly MAX_CACHE_SIZE = 20;
  private readonly MAX_RECENT_PRS = 10;

  private prDataRepo: IPRDataRepository;
  private prChatHistoryRepo: IPRChatHistoryRepository;
  private recentPRRepo: IRecentPRRepository;

  constructor(
    prDataRepo: IPRDataRepository,
    prChatHistoryRepo: IPRChatHistoryRepository,
    recentPRRepo: IRecentPRRepository,
  ) {
    this.prDataRepo = prDataRepo;
    this.prChatHistoryRepo = prChatHistoryRepo;
    this.recentPRRepo = recentPRRepo;
  }

  /**
   * Create instance with dependency injection
   */
  static create(
    prDataRepo: IPRDataRepository,
    prChatHistoryRepo: IPRChatHistoryRepository,
    recentPRRepo: IRecentPRRepository,
  ): PRDataStorageService {
    return new PRDataStorageService(prDataRepo, prChatHistoryRepo, recentPRRepo);
  }

  /**
   * Save PR data with cache size management
   */
  async savePRDataToStorage(prKey: string, prData: PRData): Promise<void> {
    // キャッシュサイズチェックと古いデータの削除
    await this.manageCacheSize();

    // PRデータを保存
    await this.prDataRepo.savePRDataItem(prKey, prData);

    // Recent PRsを更新
    await this.recentPRRepo.saveRecentPR(prKey, prData.title);
    await this.recentPRRepo.cleanupRecentPRs(this.MAX_RECENT_PRS);
  }

  /**
   * Save analysis result
   */
  async saveAnalysisResultToStorage(prKey: string, analysisResult: PRAnalysisResult): Promise<void> {
    await this.prDataRepo.updateAnalysisResult(prKey, analysisResult);
  }

  /**
   * Save file chat histories
   */
  async saveFileChatHistoriesToStorage(prKey: string, histories: FileChatHistories): Promise<void> {
    // まず既存のPR関連チャット履歴を削除
    await this.prChatHistoryRepo.removePRChatHistories(prKey);

    // 新しい履歴を保存
    await this.prChatHistoryRepo.saveFileChatHistories(prKey, histories);
  }

  /**
   * Get file chat histories from storage
   */
  async getFileChatHistoriesFromStorage(prKey: string, filename: string): Promise<ChatMessage[]> {
    return await this.prChatHistoryRepo.getSingleFileChatHistory(prKey, filename);
  }

  /**
   * Get all file chat histories from storage
   */
  async getAllFileChatHistoriesFromStorage(prKey: string): Promise<FileChatHistories> {
    return await this.prChatHistoryRepo.getFileChatHistories(prKey);
  }

  /**
   * Get specific PR data from storage
   */
  async getFromStorage(prKey: string): Promise<SavedPRData | null> {
    return await this.prDataRepo.getPRData(prKey);
  }

  /**
   * Get all PR data from storage
   */
  async getAllFromStorage(): Promise<SavedPRData[]> {
    return await this.prDataRepo.getAllPRData();
  }

  /**
   * Remove specific PR data from storage
   */
  async removeFromStorage(prKey: string): Promise<void> {
    // PRデータ、チャット履歴、Recent PRを削除
    await this.prDataRepo.removePRData(prKey);
    await this.prChatHistoryRepo.removePRChatHistories(prKey);
    await this.recentPRRepo.removeRecentPR(prKey);
  }

  /**
   * Get recent PRs
   */
  async getRecentPRs() {
    return await this.recentPRRepo.getRecentPRs();
  }

  /**
   * Manage cache size - remove oldest items if exceeding limit
   */
  private async manageCacheSize(): Promise<void> {
    const allData = await this.prDataRepo.getAllPRData();

    if (allData.length >= this.MAX_CACHE_SIZE) {
      // 古い順にソートして削除対象を特定
      const sortedData = allData.sort((a, b) => a.timestamp - b.timestamp);
      const toRemoveCount = sortedData.length - this.MAX_CACHE_SIZE + 1; // +1 for the new item
      const keysToRemove = sortedData.slice(0, toRemoveCount).map(item => item.key);

      // PRデータ、チャット履歴、Recent PRsをバッチで削除
      await this.prDataRepo.removePRDataBatch(keysToRemove);
      await this.prChatHistoryRepo.removePRChatHistoriesBatch(keysToRemove);
      await this.recentPRRepo.removeRecentPRsBatch(keysToRemove);
    }
  }
}
