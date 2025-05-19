import type { PRData } from '../types';

// レビュー時間を計算する関数（単位：時間）
export const calculateReviewTime = (prData: PRData): number => {
  if (!prData.created_at) {
    return 0; // レビューがまだアサインされていない
  }

  const reviewStartTime = new Date(prData.created_at).getTime();
  let reviewEndTime: number;

  if (prData.merged_at) {
    // マージされている場合はマージされた時間を使用
    reviewEndTime = new Date(prData.merged_at).getTime();
  } else {
    // マージされていない場合は現在時刻を使用
    reviewEndTime = Date.now();
  }

  // 差分を時間単位で計算（ミリ秒→時間に変換）
  const diffInHours = (reviewEndTime - reviewStartTime) / (1000 * 60 * 60);
  return Math.round(diffInHours * 10) / 10; // 小数第1位まで表示
};

// GitHub PR URLかどうかを判定する関数（ドメインに依存しない実装）
export const isGitHubPRPage = (url: string): boolean => {
  // PRが含まれているURLかどうかをチェック（パスが追加されていても対応）
  // ドメイン名に依存しないパターンマッチング
  const prRegex = /https?:\/\/[^/]+\/[^/]+\/[^/]+\/pull\/\d+/;
  return prRegex.test(url);
};

// PRのURLからオーナー、リポジトリ、PR番号を抽出する関数
export const extractPRInfo = (url: string): { owner: string; repo: string; prNumber: string } | null => {
  // PR番号までのURLを抽出（それ以降のパスは無視する）
  // ドメイン名に依存しないパターンマッチング
  const baseMatch = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!baseMatch) return null;

  const [, owner, repo, prNumber] = baseMatch;
  return { owner, repo, prNumber };
};

/**
 * 標準化されたPR URLを生成する（PR番号より後のパスを除去）
 */
export const normalizePRUrl = (url: string): string | null => {
  const prInfo = extractPRInfo(url);
  if (!prInfo) return null;

  // ドメイン部分を保持するために元のURLからドメイン部分を抽出
  const domainMatch = url.match(/^(https?:\/\/[^/]+)/);
  if (!domainMatch) return null;

  const domainPart = domainMatch[1];
  const { owner, repo, prNumber } = prInfo;

  return `${domainPart}/${owner}/${repo}/pull/${prNumber}`;
};
