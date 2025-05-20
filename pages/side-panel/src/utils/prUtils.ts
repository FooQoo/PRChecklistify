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

/**
 * owner/repo/123 のようなkeyからPR情報を抽出する
 */
export const extractPRInfoFromKey = (key: string): { owner: string; repo: string; prNumber: string } | null => {
  const match = key.match(/^([^/]+)\/([^/]+)\/(\d+)$/);
  if (!match) return null;
  const [, owner, repo, prNumber] = match;
  return { owner, repo, prNumber };
};

export const getPrKey = (owner: string | undefined, repo: string | undefined, prNumber: string | undefined): string => {
  if (!owner || !repo || !prNumber) {
    throw new Error('Invalid PR information');
  }
  return `${owner}/${repo}/${prNumber}`;
};
