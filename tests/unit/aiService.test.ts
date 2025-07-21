import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAIService } from '../../pages/side-panel/src/services/aiService';
import type { ModelClient } from '../../pages/side-panel/src/repositories/ai/modelClient';

const mockClient: ModelClient = {
  analyzePR: async (pr, file) => ({ filename: file.filename }) as any,
  streamChatCompletion: async () => {},
};

const factory = async () => mockClient;

test('AIService uses injected model client', async () => {
  const service = createAIService(factory);
  const result = await service.generateChecklist({ files: [] } as any, { filename: 'test.ts' } as any, 'en' as any);
  assert.equal(result.filename, 'test.ts');
});
