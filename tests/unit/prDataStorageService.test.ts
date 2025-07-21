import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRDataStorageService,
  type IPRDataRepository,
  type IPRChatHistoryRepository,
  type IRecentPRRepository,
} from '../../pages/side-panel/src/services/prDataStorageService';
import type { PRData, SavedPRData, PRAnalysisResult } from '../../pages/side-panel/src/types';

// Mock types for repositories with proper type definitions
interface ChatMessage {
  sender: string;
  message: string;
}

interface FileChatHistories {
  [filename: string]: ChatMessage[];
}

interface RecentPR {
  key: string;
  title: string;
  timestamp: number;
}

// Create mock repositories
const createMockPRDataRepository = (overrides: Partial<IPRDataRepository> = {}): IPRDataRepository => {
  let mockData: SavedPRData[] = [];

  return {
    savePRDataItem: async (prKey: string, prData: PRData, analysisResult?: PRAnalysisResult) => {
      const existingIndex = mockData.findIndex(item => item.key === prKey);
      const newItem = {
        key: prKey,
        data: prData,
        timestamp: Date.now(),
        analysisResult,
      } as SavedPRData;

      if (existingIndex >= 0) {
        mockData[existingIndex] = newItem;
      } else {
        mockData.push(newItem);
      }
    },
    updateAnalysisResult: async (prKey: string, analysisResult: PRAnalysisResult) => {
      const existingIndex = mockData.findIndex(item => item.key === prKey);
      if (existingIndex >= 0) {
        mockData[existingIndex] = {
          ...mockData[existingIndex],
          analysisResult,
          timestamp: Date.now(),
        };
      }
    },
    getPRData: async (prKey: string) => {
      return mockData.find(item => item.key === prKey) || null;
    },
    getAllPRData: async () => [...mockData],
    removePRData: async (prKey: string) => {
      mockData = mockData.filter(item => item.key !== prKey);
    },
    removePRDataBatch: async (prKeys: string[]) => {
      mockData = mockData.filter(item => !prKeys.includes(item.key));
    },
    ...overrides,
  };
};

const createMockChatHistoryRepository = (
  overrides: Partial<IPRChatHistoryRepository> = {},
): IPRChatHistoryRepository => {
  const mockChatData: Record<string, FileChatHistories> = {};

  return {
    saveFileChatHistories: async (prKey: string, histories: FileChatHistories) => {
      mockChatData[prKey] = histories;
    },
    getFileChatHistories: async (prKey: string) => {
      return mockChatData[prKey] || {};
    },
    getSingleFileChatHistory: async (prKey: string, filePath: string) => {
      return mockChatData[prKey]?.[filePath] || [];
    },
    saveSingleFileChatHistory: async (prKey: string, filePath: string, messages: ChatMessage[]) => {
      if (!mockChatData[prKey]) {
        mockChatData[prKey] = {};
      }
      mockChatData[prKey][filePath] = messages;
    },
    removePRChatHistories: async (prKey: string) => {
      delete mockChatData[prKey];
    },
    removePRChatHistoriesBatch: async (prKeys: string[]) => {
      prKeys.forEach(key => delete mockChatData[key]);
    },
    clearAllChatHistories: async () => {
      Object.keys(mockChatData).forEach(key => delete mockChatData[key]);
    },
    getStorageStats: async () => ({
      totalEntries: Object.keys(mockChatData).length,
      totalSize: JSON.stringify(mockChatData).length,
    }),
    ...overrides,
  };
};

const createMockRecentPRRepository = (overrides: Partial<IRecentPRRepository> = {}): IRecentPRRepository => {
  let mockRecentPRs: RecentPR[] = [];

  return {
    saveRecentPR: async (prKey: string, title: string) => {
      const existingIndex = mockRecentPRs.findIndex(pr => pr.key === prKey);
      const newPR = { key: prKey, title, timestamp: Date.now() };

      if (existingIndex >= 0) {
        mockRecentPRs[existingIndex] = newPR;
      } else {
        mockRecentPRs.push(newPR);
      }
    },
    getRecentPRs: async () => [...mockRecentPRs],
    cleanupRecentPRs: async (keepCount: number) => {
      if (mockRecentPRs.length > keepCount) {
        mockRecentPRs.sort((a, b) => b.timestamp - a.timestamp);
        mockRecentPRs = mockRecentPRs.slice(0, keepCount);
      }
    },
    removeRecentPR: async (prKey: string) => {
      mockRecentPRs = mockRecentPRs.filter(pr => pr.key !== prKey);
    },
    removeRecentPRsBatch: async (prKeys: string[]) => {
      mockRecentPRs = mockRecentPRs.filter(pr => !prKeys.includes(pr.key));
    },
    ...overrides,
  };
};

// Mock sample data
const mockPRData: PRData = {
  id: 1,
  number: 1,
  title: 'Test PR',
  state: 'open',
  body: 'Test PR description',
  html_url: 'https://github.com/owner/repo/pull/1',
  user: { login: 'testuser', avatar_url: 'https://avatar.url' },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  closed_at: null,
  merged_at: null,
  merge_commit_sha: null,
  base: { ref: 'main', sha: 'abc123' },
  head: { ref: 'feature', sha: 'def456' },
  additions: 10,
  deletions: 5,
  changed_files: 2,
  files: [],
  commits: 3,
  comments: 1,
  review_comments: 2,
  instructions: undefined,
  readme: '# Test Repository',
  userComments: [],
};

const mockAnalysisResult: PRAnalysisResult = {
  summary: 'Test analysis summary',
  fileAnalysis: [
    {
      filename: 'test.ts',
      explanation: 'This is a test file',
      checklistItems: [
        { id: '1', description: 'Review logic', isChecked: false },
        { id: '2', description: 'Check types', isChecked: false },
      ],
    },
  ],
};

describe('PRDataStorageService', () => {
  test('creates instance successfully', () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);
    assert.ok(service instanceof PRDataStorageService);
  });

  test('saves PR data with cache management', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);

    const prKey = 'testowner/testrepo/1';

    // Test saving PR data
    await service.savePRDataToStorage(prKey, mockPRData);

    const savedData = await mockPRDataRepo.getPRData(prKey);
    const recentPRs = await mockRecentRepo.getRecentPRs();

    assert.ok(savedData);
    assert.equal(savedData.key, prKey);
    assert.equal(savedData.data.title, 'Test PR');
    assert.equal(recentPRs.length, 1);
    assert.equal(recentPRs[0].title, 'Test PR');
  });

  test('handles cache size management with batch operations', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    // Simulate cache being full (MAX_CACHE_SIZE = 20)
    const oldPRs = Array.from({ length: 25 }, (_, i) => ({
      key: `owner/repo/${i}`,
      data: { ...mockPRData, id: i, number: i, title: `PR ${i}` },
      timestamp: Date.now() - (25 - i) * 1000, // Older PRs have smaller timestamps
      analysisResult: undefined,
    }));

    // Mock getAllPRData to return full cache
    const fullCacheMockRepo = createMockPRDataRepository({
      getAllPRData: async () => oldPRs,
    });

    const allData = await fullCacheMockRepo.getAllPRData();
    assert.equal(allData.length, 25);

    // Simulate cache management logic
    if (allData.length >= 20) {
      // MAX_CACHE_SIZE
      const sortedData = allData.sort((a, b) => a.timestamp - b.timestamp);
      const toRemoveCount = sortedData.length - 20 + 1; // +1 for new item
      const keysToRemove = sortedData.slice(0, toRemoveCount).map(item => item.key);

      await mockPRDataRepo.removePRDataBatch(keysToRemove);
      await mockChatRepo.removePRChatHistoriesBatch(keysToRemove);
      await mockRecentRepo.removeRecentPRsBatch(keysToRemove);

      assert.equal(keysToRemove.length, 6); // Should remove 6 oldest items
    }
  });

  test('saves and retrieves analysis results', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);
    const prKey = 'testowner/testrepo/1';

    // Save PR data first
    await service.savePRDataToStorage(prKey, mockPRData);

    // Update with analysis result
    await service.saveAnalysisResultToStorage(prKey, mockAnalysisResult);

    const savedData = await service.getFromStorage(prKey);

    assert.ok(savedData);
    assert.ok(savedData.analysisResult);
    assert.equal(savedData.analysisResult.fileAnalysis.length, 1);
    assert.equal(savedData.analysisResult.fileAnalysis[0].filename, 'test.ts');
    assert.equal(savedData.analysisResult.fileAnalysis[0].checklistItems.length, 2);
  });

  test('manages file chat histories', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);
    const prKey = 'testowner/testrepo/1';
    const fileChatHistories = {
      'test.ts': [
        { sender: 'user', message: 'What does this function do?' },
        { sender: 'ai', message: 'This function handles...' },
      ],
      'README.md': [{ sender: 'user', message: 'Update the documentation' }],
    };

    // Save chat histories
    await service.saveFileChatHistoriesToStorage(prKey, fileChatHistories);

    // Retrieve all chat histories
    const allHistories = await service.getAllFileChatHistoriesFromStorage(prKey);
    assert.deepEqual(allHistories, fileChatHistories);

    // Retrieve single file history
    const testFileHistory = await service.getFileChatHistoriesFromStorage(prKey, 'test.ts');
    assert.equal(testFileHistory.length, 2);
    assert.equal(testFileHistory[0].sender, 'user');
    assert.equal(testFileHistory[1].sender, 'ai');
  });

  test('removes data with coordination across repositories', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);
    const prKey = 'testowner/testrepo/1';

    // Setup data in all repositories
    await service.savePRDataToStorage(prKey, mockPRData);
    await service.saveFileChatHistoriesToStorage(prKey, { 'test.ts': [{ sender: 'user', message: 'test' }] });

    // Verify data exists
    assert.ok(await service.getFromStorage(prKey));
    assert.ok(Object.keys(await service.getAllFileChatHistoriesFromStorage(prKey)).length > 0);
    assert.equal((await service.getRecentPRs()).length, 1);

    // Remove data from all repositories
    await service.removeFromStorage(prKey);

    // Verify data is removed
    assert.equal(await service.getFromStorage(prKey), null);
    assert.deepEqual(await service.getAllFileChatHistoriesFromStorage(prKey), {});
    assert.equal((await service.getRecentPRs()).length, 0);
  });

  test('handles recent PR cleanup correctly', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);

    // Add multiple recent PRs
    const prs = Array.from({ length: 15 }, (_, i) => ({
      key: `owner/repo/${i}`,
      title: `PR ${i}`,
    }));

    for (const pr of prs) {
      const prData = { ...mockPRData, title: pr.title };
      await service.savePRDataToStorage(pr.key, prData);
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const recentPRs = await service.getRecentPRs();
    assert.equal(recentPRs.length, 10); // Should be limited to MAX_RECENT_PRS = 10

    // Should keep the most recent ones (highest indices)
    const titles = recentPRs.map(pr => pr.title).sort();
    assert.ok(titles.includes('PR 14')); // Most recent should be kept
    assert.ok(!titles.includes('PR 0')); // Oldest should be removed
  });

  test('handles empty data gracefully', async () => {
    const mockPRDataRepo = createMockPRDataRepository();
    const mockChatRepo = createMockChatHistoryRepository();
    const mockRecentRepo = createMockRecentPRRepository();

    const service = new PRDataStorageService(mockPRDataRepo, mockChatRepo, mockRecentRepo);

    // Test with non-existent data
    const result = await service.getFromStorage('nonexistent/key');
    assert.equal(result, null);

    const chatHistories = await service.getAllFileChatHistoriesFromStorage('nonexistent/key');
    assert.deepEqual(chatHistories, {});

    const recentPRs = await service.getRecentPRs();
    assert.deepEqual(recentPRs, []);

    // Test batch operations with empty arrays
    await mockPRDataRepo.removePRDataBatch([]);
    await mockChatRepo.removePRChatHistoriesBatch([]);
    await mockRecentRepo.removeRecentPRsBatch([]);

    // Should not throw errors
    assert.ok(true);
  });
});
