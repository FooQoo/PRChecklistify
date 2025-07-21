import { prDataCacheStorage } from '@extension/storage';
import type { PRData, SavedPRData, PRAnalysisResult } from '../../types';

/**
 * Repository for PR data storage operations
 * Simple data access layer - no business logic, just key-based CRUD operations
 */
export class PRDataRepository {
  /**
   * Save PR data item to storage
   */
  async savePRDataItem(prKey: string, prData: PRData, analysisResult?: PRAnalysisResult): Promise<void> {
    const savedData = await prDataCacheStorage.get();
    const existingIndex = savedData.findIndex(item => item.key === prKey);

    const dataItem = {
      key: prKey,
      data: prData as unknown,
      timestamp: Date.now(),
      analysisResult: analysisResult as unknown,
    };

    if (existingIndex >= 0) {
      savedData[existingIndex] = dataItem;
    } else {
      savedData.push(dataItem);
    }

    await prDataCacheStorage.set(savedData);
  }

  /**
   * Update analysis result for existing PR data
   */
  async updateAnalysisResult(prKey: string, analysisResult: PRAnalysisResult): Promise<void> {
    const savedData = await prDataCacheStorage.get();
    const existingIndex = savedData.findIndex(item => item.key === prKey);

    if (existingIndex >= 0) {
      savedData[existingIndex] = {
        ...savedData[existingIndex],
        analysisResult: analysisResult as unknown,
        timestamp: Date.now(),
      };
      await prDataCacheStorage.set(savedData);
    }
  }

  /**
   * Get specific PR data by key
   */
  async getPRData(prKey: string): Promise<SavedPRData | null> {
    try {
      const savedData = await prDataCacheStorage.get();
      const found = savedData.find(item => item.key === prKey);
      return found as SavedPRData | null;
    } catch {
      return null;
    }
  }

  /**
   * Get all PR data
   */
  async getAllPRData(): Promise<SavedPRData[]> {
    try {
      const result = await prDataCacheStorage.get();
      return result as SavedPRData[];
    } catch {
      return [];
    }
  }

  /**
   * Remove PR data by key
   */
  async removePRData(prKey: string): Promise<void> {
    const savedData = await prDataCacheStorage.get();
    const filteredData = savedData.filter(item => item.key !== prKey);
    await prDataCacheStorage.set(filteredData);
  }

  /**
   * Remove multiple PR data items by keys
   */
  async removePRDataBatch(prKeys: string[]): Promise<void> {
    const savedData = await prDataCacheStorage.get();
    const filteredData = savedData.filter(item => !prKeys.includes(item.key));
    await prDataCacheStorage.set(filteredData);
  }
}

// シングルトンとしてエクスポート
export const prDataRepository = new PRDataRepository();
