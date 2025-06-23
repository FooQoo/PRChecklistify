import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PrData } from './types.js';
import { buildPrText, getEmbeddingFromText, semanticSearch } from './semanticSearch.js';

// __dirnameをESMで定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PR_PATH = path.join(__dirname, '../prs.jsonl');

// PRデータのロード
const loadPrs = (): PrData[] => {
  const raw = fs.readFileSync(PR_PATH, 'utf-8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as PrData);
};
const prs: PrData[] = loadPrs();

const server = new McpServer({
  name: 'pr-semantic-search-server',
  version: '1.0.0',
});

// PR意味検索ツール
server.registerTool(
  'pr-semantic-search',
  {
    title: 'PR Semantic Search',
    description: '与えられたPR情報（url, title, body, files）から意味的に類似したPRを検索します。',
    inputSchema: z.object({
      url: z.string(),
      title: z.string(),
      body: z.string(),
      files: z.array(z.string()),
    }).shape,
  },
  async ({ url, title, body, files }) => {
    // urlからdomain, org, repoを抽出
    const match = url.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?(?:[/?#]|$)/);
    if (!match) {
      return { content: [{ type: 'text', text: 'Invalid url format' }] };
    }
    const domain = match[1],
      org = match[2],
      repo = match[3];
    // text生成
    const text = buildPrText({ title, body, files });
    let queryEmbedding: number[];
    try {
      queryEmbedding = await getEmbeddingFromText(text);
    } catch {
      return { content: [{ type: 'text', text: 'Failed to generate embedding' }] };
    }
    // 検索
    const top3 = semanticSearch(prs, queryEmbedding, domain, org, repo, 3);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(top3, null, 2),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
