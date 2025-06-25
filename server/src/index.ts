import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PrData } from './types.js';
import { buildPrText, getEmbeddingFromText, semanticSearch } from './semanticSearch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PR_PATH = path.join(__dirname, '../prs.jsonl');

const loadPrs = (): PrData[] => {
  const raw = fs.readFileSync(PR_PATH, 'utf-8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as PrData);
};
const prs: PrData[] = loadPrs();

const server = new FastMCP({
  name: 'pr-semantic-search-server',
  version: '1.0.0',
  health: {
    // Enable / disable (default: true)
    enabled: true,
    // Body returned by the endpoint (default: 'ok')
    message: 'healthy',
    // Path that should respond (default: '/health')
    path: '/healthz',
    // HTTP status code to return (default: 200)
    status: 200,
  },
});

server.addTool({
  name: 'pr-semantic-search',
  description: '与えられたPR情報（url, title, body, files）から意味的に類似したPRを検索します。',
  parameters: z.object({
    url: z.string({ description: 'PRのURL' }),
    title: z.string({ description: 'PRのタイトル' }),
    body: z.string({ description: 'PRの本文' }),
    files: z.string({ description: 'PRのファイル（絶対パス、カンマ区切り）' }),
  }),
  execute: async ({ url, title, body, files }) => {
    const match = url.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?(?:[/?#]|$)/);
    if (!match) {
      return 'Invalid url format';
    }
    const domain = match[1],
      org = match[2],
      repo = match[3];

    // filesをカンマ区切りで配列化
    const fileList = files
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const text = buildPrText({ title, body, files: fileList });
    let queryEmbedding: number[];
    try {
      queryEmbedding = await getEmbeddingFromText(text);
    } catch (err) {
      return `Failed to generate embedding: ${err}`;
    }
    const top3 = semanticSearch(prs, queryEmbedding, domain, org, repo, 3).map(pr => ({
      url: `https://${pr.domain}/${pr.org}/${pr.repo}/pull/${pr.pr_id}`,
      title: pr.title,
      body: pr.body,
      comments: pr.comments.map(c => ({
        body: c.body,
        author: c.author,
        created_at: c.created_at,
        filename: c.filename,
      })),
    }));
    console.log(`Found ${top3.length} similar PRs for query: ${title}`);
    return JSON.stringify(top3, null, 2);
  },
});

server.start({
  transportType: 'httpStream',
  httpStream: {
    port: 8080,
  },
});
