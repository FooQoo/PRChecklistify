import { recentPRsStorage, type RecentPR } from '@extension/storage';

/**
 * Repository for recent PR storage operations
 * Simple data access layer - no business logic, just key-based CRUD operations
 */
export class RecentPRRepository {
  /**
   * Save recent PR entry
   */
  async saveRecentPR(prKey: string, title: string): Promise<void> {
    const recentPRs = await recentPRsStorage.get();
    const newPRInfo: RecentPR = {
      title,
      key: prKey,
      timestamp: Date.now(),
    };

    const existingIndex = recentPRs.findIndex(pr => pr.key === prKey);
    if (existingIndex >= 0) {
      recentPRs[existingIndex] = newPRInfo;
    } else {
      recentPRs.push(newPRInfo);
    }

    await recentPRsStorage.set(recentPRs);
  }

  /**
   * Get recent PRs
   */
  async getRecentPRs(): Promise<RecentPR[]> {
    try {
      return await recentPRsStorage.get();
    } catch {
      return [];
    }
  }

  /**
   * Remove old recent PRs (keep only specified count)
   */
  async cleanupRecentPRs(keepCount: number): Promise<void> {
    const recentPRs = await recentPRsStorage.get();
    if (recentPRs.length > keepCount) {
      recentPRs.sort((a, b) => b.timestamp - a.timestamp);
      const cleaned = recentPRs.slice(0, keepCount);
      await recentPRsStorage.set(cleaned);
    }
  }

  /**
   * Remove specific recent PR by key
   */
  async removeRecentPR(prKey: string): Promise<void> {
    const recentPRs = await recentPRsStorage.get();
    const filteredPRs = recentPRs.filter(pr => pr.key !== prKey);
    await recentPRsStorage.set(filteredPRs);
  }

  /**
   * Remove multiple recent PRs by keys
   */
  async removeRecentPRsBatch(prKeys: string[]): Promise<void> {
    const recentPRs = await recentPRsStorage.get();
    const filteredPRs = recentPRs.filter(pr => !prKeys.includes(pr.key));
    await recentPRsStorage.set(filteredPRs);
  }

  /**
   * Clear all recent PRs
   */
  async clearAllRecentPRs(): Promise<void> {
    await recentPRsStorage.set([]);
  }
}

// シングルトンとしてエクスポート
export const recentPRRepository = new RecentPRRepository();
