import type { PRData, SavedPRData, PRAnalysisResult, PRFile } from '../types';
import { normalizePRUrl } from '../utils/prUtils';
import { githubTokenStorage } from '@extension/storage';

// PRデータをローカルストレージに保存・取得するためのユーティリティ
class PRDataStorage {
  private readonly STORAGE_KEY = 'pr_data_cache';
  private readonly MAX_CACHE_SIZE = 20; // 最大キャッシュ数

  // PRデータを保存
  async saveToStorage(prUrl: string, prData: PRData, analysisResult?: PRAnalysisResult): Promise<void> {
    try {
      // 現在のキャッシュを取得
      const savedData = await this.getAllFromStorage();

      // 新しいPRデータを作成
      const newPRData: SavedPRData = {
        url: prUrl,
        data: prData,
        timestamp: Date.now(),
        analysisResult,
      };

      // 既存のデータがあれば更新、なければ追加
      const existingIndex = savedData.findIndex(item => item.url === prUrl);

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
      await this.updateRecentPRs(prUrl, prData.title);
    } catch (error) {
      console.error('Error saving PR data to storage:', error);
      throw error;
    }
  }

  // 特定のPRデータを取得
  async getFromStorage(prUrl: string): Promise<SavedPRData | null> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const savedData: SavedPRData[] = result[this.STORAGE_KEY] || [];
      const prData = savedData.find(item => item.url === prUrl) || null;
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
      const savedData = await this.getAllFromStorage();
      const filteredData = savedData.filter(item => item.url !== prUrl);
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
  private async updateRecentPRs(url: string, title: string): Promise<void> {
    try {
      // PR番号より後ろのパスを削除して標準化
      const normalizedUrl = normalizePRUrl(url) || url;

      const result = await chrome.storage.local.get('recentPRs');
      let recentPRs = result.recentPRs || [];

      // 念のため重複を削除（同じURLのエントリが複数ある場合に対応）
      recentPRs = recentPRs.filter((pr: { url: string }, index: number, self: any[]) => {
        // 各URLを標準化して比較
        const normalizedCurrentUrl = normalizePRUrl(pr.url) || pr.url;
        return (
          index ===
          self.findIndex((p: { url: string }) => {
            const normalizedItemUrl = normalizePRUrl(p.url) || p.url;
            return normalizedItemUrl === normalizedCurrentUrl;
          })
        );
      });

      // 新しいPR情報
      const newPRInfo = {
        url: normalizedUrl, // 標準化したURLを保存
        title,
        timestamp: Date.now(), // 現在の時刻で常に更新
      };

      // 既存のエントリーを確認（標準化したURLで検索）
      const existingIndex = recentPRs.findIndex((pr: { url: string }) => {
        const normalizedItemUrl = normalizePRUrl(pr.url) || pr.url;
        return normalizedItemUrl === normalizedUrl;
      });

      if (existingIndex >= 0) {
        // 既存のものを更新
        console.log(`Updating existing PR in history: ${normalizedUrl}`);
        recentPRs[existingIndex] = newPRInfo;
      } else {
        console.log(`Adding new PR to history: ${normalizedUrl}`);
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
      console.log(`Saved ${recentPRs.length} PRs to history`);
    } catch (error) {
      console.error('Error updating recent PRs:', error);
    }
  }
}

// シングルトンとしてエクスポート
export const prDataStorage = new PRDataStorage();

// Service to fetch PR data from GitHub
export const fetchPRData = async (prUrl: string): Promise<PRData | null> => {
  try {
    // Extract owner, repo, and PR number from URL
    const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return null;

    const [, owner, repo, prNumber] = match;

    console.log(`Fetching PR data for ${owner}/${repo}#${prNumber}`);

    // Get GitHub token if available
    const token = await githubTokenStorage.get();
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

    // Fetch PR data from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers,
    });

    if (!response.ok) {
      console.error('Failed to fetch PR data:', response.statusText);
      return null;
    }

    const prData = await response.json();

    // Get files changed in PR
    const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
      headers,
    });

    if (!filesResponse.ok) {
      console.error('Failed to fetch PR files:', filesResponse.statusText);
      return null;
    }

    const filesData = await filesResponse.json();

    // レビューデータを取得（レビューがアサインされた時間を特定するため）
    const reviewsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
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
      files: filesData.map((file: PRFile) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
        comments: '',
      })),
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
