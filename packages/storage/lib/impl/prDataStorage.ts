import { createStorage } from '../base/base.js';
import type { PRDataCache, RecentPR } from '../types/prData.js';

/**
 * Storage for PR data cache
 */
export const prDataCacheStorage = createStorage<PRDataCache>('prDataCache', [], {
  serialization: {
    serialize: (value: PRDataCache) => JSON.stringify(value),
    deserialize: (text: string) => {
      try {
        return JSON.parse(text) as PRDataCache;
      } catch {
        return [];
      }
    },
  },
  liveUpdate: true,
});

/**
 * Storage for recent PRs
 */
export const recentPRsStorage = createStorage<RecentPR[]>('recentPRs', [], {
  serialization: {
    serialize: (value: RecentPR[]) => JSON.stringify(value),
    deserialize: (text: string) => {
      try {
        return JSON.parse(text) as RecentPR[];
      } catch {
        return [];
      }
    },
  },
  liveUpdate: true,
});
