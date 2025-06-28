import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { PrData } from './types.js';

// embedding生成用モデル初期化

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const embeddingModel = google.textEmbeddingModel('text-embedding-004', {
  outputDimensionality: 512,
  taskType: 'SEMANTIC_SIMILARITY',
});

export function buildPrText({ title, body, files }: { title: string; body: string; files: string[] }): string {
  return [`Title: ${title}`, `Body: ${body}`, ...files].join('\n');
}

export async function getEmbeddingFromText(text: string): Promise<number[]> {
  const result = await embeddingModel.doEmbed({ values: [text] });
  const embedding = result.embeddings?.[0];
  if (!embedding) throw new Error('No embedding');
  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB);
}

export function semanticSearch(
  prs: PrData[],
  queryEmbedding: number[],
  domain: string,
  org: string,
  repo: string,
  topK = 3,
): PrData[] {
  const filtered = prs.filter(
    pr =>
      pr.domain === domain &&
      pr.org === org &&
      pr.repo === repo &&
      Array.isArray(pr.embedding) &&
      pr.embedding.length > 0,
  );
  const scored = filtered.map(pr => ({ pr, score: cosineSimilarity(queryEmbedding, pr.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.pr);
}
