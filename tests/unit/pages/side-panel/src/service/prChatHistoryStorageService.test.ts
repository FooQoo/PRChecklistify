import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRChatHistoryStorageService,
  type IPRChatHistoryRepository,
  type ChatMessage,
  type FileChatHistories,
} from '../../../../../../pages/side-panel/src/services/prChatHistoryStorageService';

// Mock repository implementation matching IPRChatHistoryRepository
const createMockChatHistoryRepository = (
  overrides: Partial<IPRChatHistoryRepository> = {},
): IPRChatHistoryRepository => {
  let mockData: Record<string, FileChatHistories> = {};

  return {
    saveFileChatHistories: async (prKey: string, fileChatHistories: FileChatHistories) => {
      mockData[prKey] = fileChatHistories;
    },
    getFileChatHistories: async (prKey: string) => {
      return mockData[prKey] || {};
    },
    saveSingleFileChatHistory: async (prKey: string, filePath: string, messages: ChatMessage[]) => {
      if (!mockData[prKey]) {
        mockData[prKey] = {};
      }
      mockData[prKey][filePath] = messages;
    },
    getSingleFileChatHistory: async (prKey: string, filePath: string) => {
      return mockData[prKey]?.[filePath] || [];
    },
    removePRChatHistories: async (prKey: string) => {
      delete mockData[prKey];
    },
    removePRChatHistoriesBatch: async (prKeys: string[]) => {
      prKeys.forEach(key => delete mockData[key]);
    },
    clearAllChatHistories: async () => {
      mockData = {};
    },
    getStorageStats: async () => {
      const totalEntries = Object.keys(mockData).length;
      const totalSize = JSON.stringify(mockData).length;
      return { totalEntries, totalSize };
    },
    ...overrides,
  };
};

// Sample test data
const sampleChatMessages: ChatMessage[] = [
  { sender: 'user', message: 'What does this function do?' },
  { sender: 'ai', message: 'This function handles user authentication by checking credentials against the database.' },
  { sender: 'user', message: 'Is it secure?' },
  { sender: 'ai', message: 'Yes, it uses bcrypt for password hashing and includes rate limiting.' },
];

const sampleFileChatHistories: FileChatHistories = {
  'src/auth.ts': sampleChatMessages,
  'src/utils.ts': [
    { sender: 'user', message: 'Can you explain this utility function?' },
    { sender: 'ai', message: 'This utility function formats dates according to the specified locale.' },
  ],
  'README.md': [{ sender: 'user', message: 'Should we update the documentation?' }],
};

describe('PRChatHistoryStorageService', () => {
  test('creates instance successfully', () => {
    const mockRepo = createMockChatHistoryRepository();
    const service = new PRChatHistoryStorageService(mockRepo);
    assert.ok(service instanceof PRChatHistoryStorageService);
  });

  test('saves and retrieves file chat histories', async () => {
    const mockRepo = createMockChatHistoryRepository();
    const service = new PRChatHistoryStorageService(mockRepo);

    const prKey = 'testowner/testrepo/1';

    // Test the service saves and retrieves file chat histories
    await service.saveFileChatHistories(prKey, sampleFileChatHistories);

    const retrieved = await mockRepo.getFileChatHistories(prKey);

    assert.deepEqual(retrieved, sampleFileChatHistories);
    assert.equal(Object.keys(retrieved).length, 3);
    assert.equal(retrieved['src/auth.ts'].length, 4);
    assert.equal(retrieved['src/utils.ts'].length, 2);
    assert.equal(retrieved['README.md'].length, 1);
  });

  test('saves and retrieves single file chat history', async () => {
    const mockRepo = createMockChatHistoryRepository();

    const prKey = 'testowner/testrepo/1';
    const filePath = 'src/component.tsx';
    const messages: ChatMessage[] = [
      { sender: 'user', message: 'How can I improve this React component?' },
      {
        sender: 'ai',
        message: 'Consider using React.memo for performance optimization and extracting custom hooks for state logic.',
      },
    ];

    await mockRepo.saveSingleFileChatHistory(prKey, filePath, messages);

    const retrieved = await mockRepo.getSingleFileChatHistory(prKey, filePath);

    assert.deepEqual(retrieved, messages);
    assert.equal(retrieved.length, 2);
    assert.equal(retrieved[0].sender, 'user');
    assert.equal(retrieved[1].sender, 'ai');
  });

  test('handles clearing PR chat histories', async () => {
    const mockRepo = createMockChatHistoryRepository();

    const prKey = 'testowner/testrepo/1';

    // Set up data
    await mockRepo.saveFileChatHistories(prKey, sampleFileChatHistories);

    // Verify data exists
    let retrieved = await mockRepo.getFileChatHistories(prKey);
    assert.ok(Object.keys(retrieved).length > 0);

    // Clear specific PR histories
    await mockRepo.removePRChatHistories(prKey);

    // Verify data is cleared
    retrieved = await mockRepo.getFileChatHistories(prKey);
    assert.deepEqual(retrieved, {});
  });

  test('handles clearing all chat histories', async () => {
    const mockRepo = createMockChatHistoryRepository();

    // Set up data for multiple PRs
    await mockRepo.saveFileChatHistories('owner1/repo1/1', sampleFileChatHistories);
    await mockRepo.saveFileChatHistories('owner2/repo2/2', {
      'test.js': [{ sender: 'user', message: 'Test message' }],
    });

    // Verify data exists
    let stats = await mockRepo.getStorageStats();
    assert.ok(stats.totalEntries > 0);
    assert.ok(stats.totalSize > 0);

    // Clear all histories
    await mockRepo.clearAllChatHistories();

    // Verify all data is cleared
    stats = await mockRepo.getStorageStats();
    assert.equal(stats.totalEntries, 0);

    const retrieved1 = await mockRepo.getFileChatHistories('owner1/repo1/1');
    const retrieved2 = await mockRepo.getFileChatHistories('owner2/repo2/2');
    assert.deepEqual(retrieved1, {});
    assert.deepEqual(retrieved2, {});
  });

  test('provides storage statistics', async () => {
    const mockRepo = createMockChatHistoryRepository();

    // Initially empty
    let stats = await mockRepo.getStorageStats();
    assert.equal(stats.totalEntries, 0);
    assert.equal(stats.totalSize, 2); // Empty object "{}"

    // Add some data
    await mockRepo.saveFileChatHistories('owner/repo/1', sampleFileChatHistories);
    await mockRepo.saveFileChatHistories('owner/repo/2', {
      'single.ts': [{ sender: 'user', message: 'Short message' }],
    });

    stats = await mockRepo.getStorageStats();
    assert.equal(stats.totalEntries, 2);
    assert.ok(stats.totalSize > 100); // Should be larger with actual data
  });

  test('handles non-existent data gracefully', async () => {
    const mockRepo = createMockChatHistoryRepository();

    const nonExistentKey = 'nonexistent/repo/999';

    // Getting non-existent PR chat histories
    const histories = await mockRepo.getFileChatHistories(nonExistentKey);
    assert.deepEqual(histories, {});

    // Getting non-existent single file history
    const singleHistory = await mockRepo.getSingleFileChatHistory(nonExistentKey, 'any.file');
    assert.deepEqual(singleHistory, []);

    // Removing non-existent data should not throw
    await mockRepo.removePRChatHistories(nonExistentKey);
    assert.ok(true); // Should reach here without throwing
  });

  test('supports overwriting existing chat histories', async () => {
    const mockRepo = createMockChatHistoryRepository();

    const prKey = 'testowner/testrepo/1';

    // Save initial data
    const initialHistories: FileChatHistories = {
      'file1.ts': [{ sender: 'user', message: 'Initial message' }],
    };
    await mockRepo.saveFileChatHistories(prKey, initialHistories);

    // Verify initial data
    let retrieved = await mockRepo.getFileChatHistories(prKey);
    assert.equal(retrieved['file1.ts'].length, 1);
    assert.equal(retrieved['file1.ts'][0].message, 'Initial message');

    // Overwrite with new data (simulate service clearing and saving)
    await mockRepo.removePRChatHistories(prKey);
    const newHistories: FileChatHistories = {
      'file1.ts': [
        { sender: 'user', message: 'Updated message' },
        { sender: 'ai', message: 'AI response' },
      ],
      'file2.ts': [{ sender: 'user', message: 'New file message' }],
    };
    await mockRepo.saveFileChatHistories(prKey, newHistories);

    // Verify updated data
    retrieved = await mockRepo.getFileChatHistories(prKey);
    assert.equal(retrieved['file1.ts'].length, 2);
    assert.equal(retrieved['file1.ts'][0].message, 'Updated message');
    assert.equal(retrieved['file2.ts'].length, 1);
  });

  test('handles single file chat history updates', async () => {
    const mockRepo = createMockChatHistoryRepository();

    const prKey = 'testowner/testrepo/1';
    const filePath = 'src/component.ts';

    // Add initial message
    await mockRepo.saveSingleFileChatHistory(prKey, filePath, [{ sender: 'user', message: 'First message' }]);

    let history = await mockRepo.getSingleFileChatHistory(prKey, filePath);
    assert.equal(history.length, 1);

    // Add more messages (simulating appending to conversation)
    await mockRepo.saveSingleFileChatHistory(prKey, filePath, [
      { sender: 'user', message: 'First message' },
      { sender: 'ai', message: 'AI response' },
      { sender: 'user', message: 'Follow-up question' },
    ]);

    history = await mockRepo.getSingleFileChatHistory(prKey, filePath);
    assert.equal(history.length, 3);
    assert.equal(history[2].message, 'Follow-up question');
  });

  test('maintains data consistency across operations', async () => {
    const mockRepo = createMockChatHistoryRepository();

    const prKey = 'testowner/testrepo/1';

    // Save file histories
    await mockRepo.saveFileChatHistories(prKey, sampleFileChatHistories);

    // Add a single file history to the same PR
    await mockRepo.saveSingleFileChatHistory(prKey, 'new-file.ts', [{ sender: 'user', message: 'New file question' }]);

    // Retrieve all histories - should include both the bulk saved and individually saved
    const allHistories = await mockRepo.getFileChatHistories(prKey);

    // Should have original files plus the new one
    assert.ok(allHistories['src/auth.ts']);
    assert.ok(allHistories['src/utils.ts']);
    assert.ok(allHistories['README.md']);
    assert.ok(allHistories['new-file.ts']);
    assert.equal(allHistories['new-file.ts'].length, 1);
  });
});
