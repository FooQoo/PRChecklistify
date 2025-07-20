import type { PRData, PRIdentifier } from '../types';
import { getGitHubServersWithTokens, loadGitHubServerConfig } from '../services/configLoader';

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
 * domain/owner/repo/123 のようなkeyからPR情報を抽出する
 */
export const extractPRInfoFromKey = (
  key: string,
): { domain: string; owner: string; repo: string; prNumber: string } | null => {
  const match = key.match(/^([^/]+)\/([^/]+)\/([^/]+)\/(\d+)$/);
  if (!match) return null;
  const [, domain, owner, repo, prNumber] = match;
  return { domain, owner, repo, prNumber };
};

export const getPrKey = (
  domain: string | undefined,
  owner: string | undefined,
  repo: string | undefined,
  prNumber: string | undefined,
): string => {
  if (!domain || !owner || !repo || !prNumber) {
    throw new Error('Invalid PR information');
  }
  return `${domain}/${owner}/${repo}/${prNumber}`;
};

/**
 * GitHub PRのURLからPRIdentifierを作成する
 * @param url GitHub PRのURL
 * @returns PRIdentifier または null
 */
export const parsePRUrlToPRIdentifier = (url: string): PRIdentifier | null => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // /owner/repo/pull/123 のパターンをマッチ
    const pathMatch = urlObj.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!pathMatch) return null;

    const [, owner, repo, prNumber] = pathMatch;

    return {
      owner,
      repo,
      prNumber,
      domain,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
};

/**
 * ドメインからサーバーIDを取得する
 * @param domain ドメイン名
 * @returns サーバーID
 */
export const getServerIdByDomain = async (domain: string): Promise<string> => {
  const servers = await getGitHubServersWithTokens();

  // webUrlからドメインを抽出して比較
  const server = servers.find(s => {
    try {
      const serverDomain = new URL(s.webUrl).hostname;
      return serverDomain === domain;
    } catch {
      return false;
    }
  });

  return server!.id;
};

// 指定したドメインが設定済みのGitHubサーバか確認する
export const isRegisteredGitHubServer = (domain: string): boolean => {
  const servers = loadGitHubServerConfig();
  return servers.some(server => {
    try {
      const serverDomain = new URL(server.webUrl).hostname;
      return serverDomain === domain;
    } catch {
      return false;
    }
  });
};
