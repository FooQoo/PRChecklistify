import type { PRData, SavedPRData, PRAnalysisResult, PRFile, PRIdentifier } from '../types';
import { normalizePRUrl, extractPRInfo } from '../utils/prUtils';
import { githubTokenStorage, githubApiDomainStorage } from '@extension/storage';

type RecentPR = { url: string; title: string; key?: string; timestamp: number };

// URLからPRのキー（org/repo/prNumber形式）を生成する
export const generatePRKey = (url: string): string | null => {
  const prInfo = extractPRInfo(url);
  if (!prInfo) return null;

  const { owner, repo, prNumber } = prInfo;
  return `${owner}/${repo}/${prNumber}`;
};

// PRデータをローカルストレージに保存・取得するためのユーティリティ
class PRDataStorage {
  private readonly STORAGE_KEY = 'pr_data_cache';
  private readonly MAX_CACHE_SIZE = 20; // 最大キャッシュ数

  // PRデータを保存
  async saveToStorage(prUrl: string, prData: PRData, analysisResult?: PRAnalysisResult): Promise<void> {
    try {
      // PRキーを生成
      const prKey = generatePRKey(prUrl);
      if (!prKey) {
        console.error('Failed to generate PR key from URL:', prUrl);
        throw new Error('Invalid PR URL');
      }

      // 現在のキャッシュを取得
      const savedData = await this.getAllFromStorage();

      // 新しいPRデータを作成
      const newPRData: SavedPRData = {
        url: prUrl,
        key: prKey, // キーを追加
        data: prData,
        timestamp: Date.now(),
        analysisResult,
      };

      // 既存のデータがあれば更新、なければ追加 (キーで検索)
      const existingIndex = savedData.findIndex(item => item.key === prKey);

      if (existingIndex >= 0) {
        savedData[existingIndex] = newPRData;
      } else {
        // キャッシュサイズが最大に達していれば、最も古いものを削除
        if (savedData.length >= this.MAX_CACHE_SIZE) {
          // タイムスタンプで並べ替えて古いものを削除
          savedData.sort((a, b) => b.timestamp - a.timestamp);
          savedData.pop();
        }

        savedData.push(newPRData);
      }

      // ストレージに保存
      await chrome.storage.local.set({ [this.STORAGE_KEY]: savedData });

      // 最近表示したPRの履歴も更新
      await this.updateRecentPRs(prUrl, prData.title, prKey);
    } catch (error) {
      console.error('Error saving PR data to storage:', error);
      throw error;
    }
  }

  // 特定のPRデータを取得
  async getFromStorage(prUrl: string): Promise<SavedPRData | null> {
    try {
      // PRキーを生成
      const prKey = generatePRKey(prUrl);
      if (!prKey) {
        console.error('Failed to generate PR key from URL:', prUrl);
        return null;
      }

      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const savedData: SavedPRData[] = result[this.STORAGE_KEY] || [];

      // キーでデータを検索
      const prData = savedData.find(item => item.key === prKey) || null;
      return prData;
    } catch (error) {
      console.error('Error getting PR data from storage:', error);
      return null;
    }
  }

  // すべてのPRデータを取得
  async getAllFromStorage(): Promise<SavedPRData[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('Error getting all PR data from storage:', error);
      return [];
    }
  }

  // 特定のPRデータを削除
  async removeFromStorage(prUrl: string): Promise<void> {
    try {
      // PRキーを生成
      const prKey = generatePRKey(prUrl);
      if (!prKey) {
        console.error('Failed to generate PR key from URL:', prUrl);
        return;
      }

      const savedData = await this.getAllFromStorage();
      // キーでフィルタリング
      const filteredData = savedData.filter(item => item.key !== prKey);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: filteredData });
    } catch (error) {
      console.error('Error removing PR data from storage:', error);
      throw error;
    }
  }

  // すべてのPRデータを削除
  async clearStorage(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing PR data storage:', error);
      throw error;
    }
  }

  // 最近表示したPRの履歴を更新
  private async updateRecentPRs(url: string, title: string, prKey?: string | null): Promise<void> {
    try {
      // PR番号より後ろのパスを削除して標準化
      const normalizedUrl = normalizePRUrl(url) || url;

      // PRキーがない場合は生成
      const key = prKey || generatePRKey(url);
      if (!key) {
        console.error('Failed to generate PR key from URL:', url);
        return;
      }

      const result = await chrome.storage.local.get('recentPRs');
      let recentPRs = result.recentPRs || [];

      // 念のため重複を削除（同じキーのエントリが複数ある場合に対応）
      recentPRs = recentPRs.filter((pr: RecentPR, index: number, self: RecentPR[]) => {
        if (pr.key) {
          // キーがある場合はキーで比較
          return index === self.findIndex((p: { key?: string }) => p.key === pr.key);
        } else {
          // 古いデータ形式の場合はURLで比較
          const normalizedCurrentUrl = normalizePRUrl(pr.url) || pr.url;
          return (
            index ===
            self.findIndex((p: { url: string }) => {
              const normalizedItemUrl = normalizePRUrl(p.url) || p.url;
              return normalizedItemUrl === normalizedCurrentUrl;
            })
          );
        }
      });

      // 新しいPR情報
      const newPRInfo = {
        url: normalizedUrl,
        title,
        key, // キーを追加
        timestamp: Date.now(),
      };

      // 既存のエントリーを確認（キーで検索）
      const existingIndex = recentPRs.findIndex((pr: { key?: string; url: string }) => {
        if (pr.key) {
          return pr.key === key;
        } else {
          // 古いデータ形式の場合はURLで比較
          const normalizedItemUrl = normalizePRUrl(pr.url) || pr.url;
          return normalizedItemUrl === normalizedUrl;
        }
      });

      if (existingIndex >= 0) {
        // 既存のものを更新
        console.log(`Updating existing PR in history: ${key}`);
        recentPRs[existingIndex] = newPRInfo;
      } else {
        console.log(`Adding new PR to history: ${key}`);
        // 新しいものを追加（最大10件まで）
        if (recentPRs.length >= 10) {
          // タイムスタンプで並べ替えて古いものを削除
          recentPRs.sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);
          recentPRs.pop();
        }

        recentPRs.push(newPRInfo);
      }

      // 最後にタイムスタンプでソートして保存
      recentPRs.sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);
      await chrome.storage.local.set({ recentPRs });
      console.log(`Saved ${recentPRs.length} PRs to history with key format`);
    } catch (error) {
      console.error('Error updating recent PRs:', error);
    }
  }
}

// シングルトンとしてエクスポート
export const prDataStorage = new PRDataStorage();

// Service to fetch PR data from GitHub
export const fetchPRData = async (identifier: PRIdentifier): Promise<PRData | null> => {
  try {
    const { owner, repo, prNumber } = identifier;

    console.log(`Fetching PR data for ${owner}/${repo}#${prNumber}`);

    // Get GitHub token if available
    const token = await githubTokenStorage.get();
    // Get GitHub API domain
    const apiDomain = (await githubApiDomainStorage.get()) || '';

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `token ${token}`;
      console.log('Using GitHub PAT for API requests');
    } else {
      console.log('No GitHub PAT found, API requests may be rate limited');
    }

    console.log(`Using GitHub API domain: ${apiDomain}`);

    // Fetch PR data from GitHub API
    const response = await fetch(`${apiDomain}/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers,
    });

    if (!response.ok) {
      console.error('Failed to fetch PR data:', response.statusText);
      return null;
    }

    const prData = await response.json();

    // Get files changed in PR
    const filesResponse = await fetch(`${apiDomain}/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
      headers,
    });

    if (!filesResponse.ok) {
      console.error('Failed to fetch PR files:', filesResponse.statusText);
      return null;
    }

    const filesData = await filesResponse.json();

    // --- ここから追加 ---
    // 各ファイルのcontents_urlからbase64デコードした内容を取得
    const filesWithDecodedContent = await Promise.all(
      filesData.map(async (file: PRFile) => {
        let decodedContent;
        if (file.contents_url) {
          try {
            const contentRes = await fetch(file.contents_url, { headers });
            if (contentRes.ok) {
              const contentJson = await contentRes.json();
              if (contentJson.content) {
                // 改行を除去してbase64デコード
                const base64 = contentJson.content.replace(/\n/g, '');
                decodedContent = atob(base64);
              }
            }
          } catch (e) {
            console.warn('Failed to fetch or decode file content:', file.filename, e);
          }
        }

        return {
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
          contents_url: file.contents_url,
          decodedContent, // 追加: base64デコードした内容
        } as PRFile;
      }),
    );

    console.info('file:', JSON.stringify(filesWithDecodedContent, null, 2));

    // レビューデータを取得（レビューがアサインされた時間を特定するため）
    const reviewsResponse = await fetch(`${apiDomain}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
      headers,
    });

    let reviewAssignedAt = null;

    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();

      // レビューが存在する場合、最初のレビューの時間をレビューアサイン時間として使用
      if (reviewsData && reviewsData.length > 0) {
        // レビューは時系列順に並んでいるため、最初のレビューの時間を使用
        reviewAssignedAt = reviewsData[0].submitted_at;
        console.log(`Review assigned at: ${reviewAssignedAt}`);
      } else {
        // レビューがまだない場合は、作成時間をレビューアサイン時間として使用
        reviewAssignedAt = prData.created_at;
        console.log(`No reviews found, using PR creation time: ${reviewAssignedAt}`);
      }
    } else {
      console.warn('Failed to fetch PR reviews:', reviewsResponse.statusText);
      // レビューデータを取得できない場合は、PRの作成時間を使用
      reviewAssignedAt = prData.created_at;
    }

    return {
      id: prData.id,
      number: prData.number,
      title: prData.title,
      state: prData.state,
      body: prData.body || 'No description provided.',
      html_url: prData.html_url,
      user: {
        login: prData.user.login,
        avatar_url: prData.user.avatar_url,
      },
      created_at: prData.created_at,
      updated_at: prData.updated_at,
      closed_at: prData.closed_at,
      merged_at: prData.merged_at,
      merge_commit_sha: prData.merge_commit_sha,
      base: {
        ref: prData.base.ref,
        sha: prData.base.sha,
      },
      head: {
        ref: prData.head.ref,
        sha: prData.head.sha,
      },
      additions: prData.additions,
      deletions: prData.deletions,
      changed_files: prData.changed_files,
      files: filesWithDecodedContent,
      // draft: prData.draft,
      commits: prData.commits,
      comments: prData.comments,
      review_comments: prData.review_comments,
    };
  } catch (error) {
    console.error('Error fetching PR data:', error);
    return null;
  }
};
