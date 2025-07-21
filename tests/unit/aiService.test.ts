import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../../pages/side-panel/src/services/aiService';
import type { ModelClient } from '../../pages/side-panel/src/repositories/ai/modelClient';
import type { PRData, PRFile, Checklist } from '../../pages/side-panel/src/types';

// Mock model client
const createMockModelClient = (overrides: Partial<ModelClient> = {}): ModelClient => ({
  analyzePR: async (prData: PRData, file: PRFile, languageOverride?: string): Promise<Checklist> => ({
    filename: file.filename,
    explanation: `Mock analysis for ${file.filename} (${languageOverride || 'default'})`,
    checklistItems: [
      { id: '1', description: 'Check implementation', isChecked: false },
      { id: '2', description: 'Review tests', isChecked: false },
    ],
  }),
  streamChatCompletion: async (
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void> => {
    const response = `Mock AI response for ${messages.length} messages`;
    // Simulate streaming
    for (const char of response) {
      if (options?.signal?.aborted) {
        throw new Error('Request aborted');
      }
      onToken(char);
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  },
  ...overrides,
});

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

const mockPRFile: PRFile = {
  filename: 'test.ts',
  status: 'modified',
  additions: 5,
  deletions: 2,
  patch: '@@ -1,3 +1,6 @@\n console.log("test");',
  contents_url: 'https://api.github.com/repos/owner/repo/contents/test.ts',
  decodedContent: 'console.log("test");',
};

describe('AIService', () => {
  test('creates instance successfully', () => {
    const mockClient = createMockModelClient();
    const mockFactory = async () => mockClient;
    const service = new AIService(mockFactory);
    assert.ok(service instanceof AIService);
  });

  test('generates analysis with injected model client', async () => {
    const mockClient = createMockModelClient();
    const mockFactory = async () => mockClient;
    const service = new AIService(mockFactory);

    const result = await service.generateAnalysis(mockPRData, mockPRFile, 'en');

    assert.equal(result.filename, 'test.ts');
    assert.equal(result.explanation, 'Mock analysis for test.ts (en)');
    assert.equal(result.checklistItems.length, 2);
    assert.equal(result.checklistItems[0].description, 'Check implementation');
  });

  test('generates checklist with injected model client', async () => {
    const mockClient = createMockModelClient();
    const mockFactory = async () => mockClient;
    const service = new AIService(mockFactory);

    const result = await service.generateChecklist(mockPRData, mockPRFile, 'en');

    assert.equal(result.filename, 'test.ts');
    assert.equal(result.checklistItems.length, 2);
    assert.equal(result.checklistItems[0].isChecked, false);
  });

  test('handles streaming chat completion', async () => {
    const mockClient = createMockModelClient();
    const mockFactory = async () => mockClient;
    const service = new AIService(mockFactory);

    let streamedContent = '';
    const onToken = (token: string) => {
      streamedContent += token;
    };

    await service.streamFileChat(
      mockPRData,
      mockPRFile,
      [{ sender: 'user', message: 'What does this file do?' }],
      onToken,
      'en',
      {},
      { 'test.ts': mockPRFile.patch || '' },
    );

    assert.ok(streamedContent.length > 0);
    assert.ok(streamedContent.includes('Mock AI'));
  });

  test('handles model client factory errors', async () => {
    const errorFactory = async () => {
      throw new Error('Model client creation failed');
    };
    const service = new AIService(errorFactory);

    await assert.rejects(async () => await service.generateAnalysis(mockPRData, mockPRFile, 'en'), /llmServiceError/);
  });

  test('validates PR data before processing', async () => {
    const mockClient = createMockModelClient();
    const mockFactory = async () => mockClient;
    const service = new AIService(mockFactory);

    const invalidPRData = null as unknown as PRData;

    await assert.rejects(async () => await service.generateAnalysis(invalidPRData, mockPRFile, 'en'), /invalidPRData/);
  });

  test('handles streaming abort signal', async () => {
    const mockClient = createMockModelClient();
    const mockFactory = async () => mockClient;
    const service = new AIService(mockFactory);

    const messages = [{ sender: 'user', message: 'Test message' }];
    const abortController = new AbortController();

    // Abort immediately
    abortController.abort();

    await assert.rejects(
      async () =>
        await service.streamFileChat(
          mockPRData,
          mockPRFile,
          messages,
          () => {},
          'en',
          { signal: abortController.signal },
          {},
        ),
      /llmServiceError/,
    );
  });

  test('uses custom model client implementation', async () => {
    const customClient = createMockModelClient({
      analyzePR: async (prData: PRData, file: PRFile): Promise<Checklist> => ({
        filename: file.filename,
        explanation: 'Custom analysis implementation',
        checklistItems: [
          { id: 'custom1', description: 'Custom check 1', isChecked: false },
          { id: 'custom2', description: 'Custom check 2', isChecked: false },
          { id: 'custom3', description: 'Custom check 3', isChecked: false },
        ],
      }),
    });

    const customFactory = async () => customClient;
    const service = new AIService(customFactory);

    const result = await service.generateAnalysis(mockPRData, mockPRFile, 'en');

    assert.equal(result.explanation, 'Custom analysis implementation');
    assert.equal(result.checklistItems.length, 3);
    assert.equal(result.checklistItems[0].id, 'custom1');
    assert.equal(result.checklistItems[0].description, 'Custom check 1');
  });
});
