import { prDataRepository } from '@src/repositories/storage/prDataRepository';
import {
  prChatHistoryRepository,
  type ChatMessage,
  type FileChatHistories,
} from '@src/repositories/storage/prChatHistoryRepository';
import { recentPRRepository } from '@src/repositories/storage/recentPRRepository';
import type { PRData, SavedPRData, PRAnalysisResult } from '@src/types';

/**
 * Service for managing PR data with business logic
 * Handles cache size management, recent PRs cleanup, and coordinates with chat history
 */
export class PRDataStorageService {
  private readonly MAX_CACHE_SIZE = 20;
  private readonly MAX_RECENT_PRS = 10;

  /**
   * Save PR data with cache size management
   */
  async savePRDataToStorage(prKey: string, prData: PRData): Promise<void> {
    // キャッシュサイズチェックと古いデータの削除
    await this.manageCacheSize();

    // PRデータを保存
    await prDataRepository.savePRDataItem(prKey, prData);

    // Recent PRsを更新
    await recentPRRepository.saveRecentPR(prKey, prData.title);
    await recentPRRepository.cleanupRecentPRs(this.MAX_RECENT_PRS);
  }

  /**
   * Save analysis result
   */
  async saveAnalysisResultToStorage(prKey: string, analysisResult: PRAnalysisResult): Promise<void> {
    await prDataRepository.updateAnalysisResult(prKey, analysisResult);
  }

  /**
   * Save file chat histories
   */
  async saveFileChatHistoriesToStorage(prKey: string, histories: FileChatHistories): Promise<void> {
    // まず既存のPR関連チャット履歴を削除
    await prChatHistoryRepository.removePRChatHistories(prKey);

    // 新しい履歴を保存
    await prChatHistoryRepository.saveFileChatHistories(prKey, histories);
  }

  /**
   * Get file chat histories from storage
   */
  async getFileChatHistoriesFromStorage(prKey: string, filename: string): Promise<ChatMessage[]> {
    return await prChatHistoryRepository.getSingleFileChatHistory(prKey, filename);
  }

  /**
   * Get all file chat histories from storage
   */
  async getAllFileChatHistoriesFromStorage(prKey: string): Promise<FileChatHistories> {
    return await prChatHistoryRepository.getFileChatHistories(prKey);
  }

  /**
   * Get specific PR data from storage
   */
  async getFromStorage(prKey: string): Promise<SavedPRData | null> {
    return await prDataRepository.getPRData(prKey);
  }

  /**
   * Get all PR data from storage
   */
  async getAllFromStorage(): Promise<SavedPRData[]> {
    return await prDataRepository.getAllPRData();
  }

  /**
   * Remove specific PR data from storage
   */
  async removeFromStorage(prKey: string): Promise<void> {
    // PRデータ、チャット履歴、Recent PRを削除
    await prDataRepository.removePRData(prKey);
    await prChatHistoryRepository.removePRChatHistories(prKey);
    await recentPRRepository.removeRecentPR(prKey);
  }

  /**
   * Get recent PRs
   */
  async getRecentPRs() {
    return await recentPRRepository.getRecentPRs();
  }

  /**
   * Manage cache size - remove oldest items if exceeding limit
   */
  private async manageCacheSize(): Promise<void> {
    const allData = await prDataRepository.getAllPRData();

    if (allData.length >= this.MAX_CACHE_SIZE) {
      // 古い順にソートして削除対象を特定
      const sortedData = allData.sort((a, b) => a.timestamp - b.timestamp);
      const toRemoveCount = sortedData.length - this.MAX_CACHE_SIZE + 1; // +1 for the new item
      const keysToRemove = sortedData.slice(0, toRemoveCount).map(item => item.key);

      // PRデータ、チャット履歴、Recent PRsをバッチで削除
      await prDataRepository.removePRDataBatch(keysToRemove);
      await prChatHistoryRepository.removePRChatHistoriesBatch(keysToRemove);
      await recentPRRepository.removeRecentPRsBatch(keysToRemove);
    }
  }
}

// シングルトンとしてエクスポート
export const prDataStorageService = new PRDataStorageService();
