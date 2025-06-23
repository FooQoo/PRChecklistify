import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PrData } from './types.js';
import { buildPrText, getEmbeddingFromText, semanticSearch } from './semanticSearch.js';

const app = express();
const PORT = process.env.PORT || 8080;

// __dirnameをESMで定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PR_PATH = path.join(__dirname, '../prs.jsonl');

// JSONLを読み込んでパース（初回起動時のみ）
const loadPrs = (): PrData[] => {
  const raw = fs.readFileSync(PR_PATH, 'utf-8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as PrData);
};

const prs: PrData[] = loadPrs();

app.use(express.json());

function extractOrgRepoFromUrl(url: string): { domain: string; org: string; repo: string } | null {
  const match = url.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?(?:[/?#]|$)/);
  if (match) {
    return { domain: match[1], org: match[2], repo: match[3] };
  }
  return null;
}

app.post('/prs/search', async (req, res) => {
  const { url, title, body, files } = req.body;

  if (!url || !title || !body || !Array.isArray(files)) {
    res.status(400).json({ error: 'Missing required body parameters' });
    return;
  }

  const parsed = extractOrgRepoFromUrl(url);
  if (!parsed) {
    res.status(400).json({ error: 'Invalid url format' });
    return;
  }
  const { domain, org, repo } = parsed;

  // text生成: title, body, filesリストを連結
  const text = buildPrText({ title, body, files });

  // クエリembedding生成
  let queryEmbedding: number[];
  try {
    queryEmbedding = await getEmbeddingFromText(text);
  } catch {
    res.status(500).json({ error: 'Failed to generate embedding' });
    return;
  }

  // 意味検索
  const top3 = semanticSearch(prs, queryEmbedding, domain, org, repo, 3);
  res.json(top3);
  return;
});

app.listen(PORT, () => {
  console.log(`✅ MCP server running on http://localhost:${PORT}`);
});
