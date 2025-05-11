import type { PRData, SavedPRData, PRAnalysisResult } from '../types';
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
      const result = await chrome.storage.local.get('recentPRs');
      const recentPRs = result.recentPRs || [];

      // 新しいPR情報
      const newPRInfo = {
        url,
        title,
        timestamp: Date.now(),
      };

      // 既存のエントリーを確認
      const existingIndex = recentPRs.findIndex((pr: { url: string }) => pr.url === url);

      if (existingIndex >= 0) {
        // 既存のものを更新
        recentPRs[existingIndex] = newPRInfo;
      } else {
        // 新しいものを追加（最大10件まで）
        if (recentPRs.length >= 10) {
          recentPRs.sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);
          recentPRs.pop();
        }

        recentPRs.push(newPRInfo);
      }

      await chrome.storage.local.set({ recentPRs });
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
      title: prData.title,
      description: prData.body || 'No description provided.',
      diffStats: {
        additions: prData.additions,
        deletions: prData.deletions,
        changedFiles: prData.changed_files,
      },
      files: filesData.map((file: any) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
        comments: '',
      })),
      user: {
        login: prData.user.login,
        avatar_url: prData.user.avatar_url,
      },
      created_at: prData.created_at,
      updated_at: prData.updated_at,
      review_assigned_at: reviewAssignedAt,
      merged_at: prData.merged_at,
      state: prData.state,
      base: {
        ref: prData.base.ref,
      },
      head: {
        ref: prData.head.ref,
      },
    };
  } catch (error) {
    console.error('Error fetching PR data:', error);
    return null;
  }
};

// Add SWR fetchers for use with useSWR
export const fetchers = {
  // Fetcher for PR data from GitHub API
  fetchPR: async (key: string) => {
    const url = key.split('pr/')[1];

    // Try to load from storage first
    const savedData = await prDataStorage.load(url);
    if (savedData) {
      return savedData;
    }

    // If no saved data, fetch from API
    return fetchPRData(url);
  },

  // Fetcher for PR analysis result from storage
  fetchAnalysis: async (key: string) => {
    const url = key.split('analysis/')[1];
    const savedAnalysis = await prDataStorage.loadAnalysis(url);

    if (savedAnalysis) {
      return savedAnalysis;
    }

    return null;
  },

  // 追加: ストレージに保存するためのヘルパー関数
  saveToStorage: async (url: string, prData: PRData, analysisResult?: PRAnalysisResult) => {
    return prDataStorage.save(url, prData, analysisResult);
  },

  // Fetcher for generating OpenAI analysis
  generateAnalysis: async (key: string, prData: PRData, language: string) => {
    console.log('Generating OpenAI analysis with SWR:', key);

    // ダミーの分析結果データを作成する関数
    const createDummyAnalysisResult = (): PRAnalysisResult => {
      return {
        summary: {
          background:
            'This PR implements a new feature that allows users to filter search results by various criteria.',
          problem: 'Users were having difficulty finding relevant items in large search result sets.',
          solution: 'Add filter controls that allow narrowing results by category, date, and other attributes.',
          implementation:
            'Implemented filter components in React with state management using Context API. Backend API was extended to support filter parameters.',
        },
        fileChecklists:
          prData?.files.map((file, index) => {
            return {
              id: `file-${index}`, // 必須の id プロパティを追加
              filename: file.filename,
              checklistItems: [
                {
                  id: `${index}-1`,
                  description: `Code is well-formatted and consistent with project style in ${file.filename.split('/').pop()}`,
                  status: 'PENDING',
                },
                {
                  id: `${index}-2`,
                  description: `Implementation follows best practices for ${file.filename.includes('.ts') ? 'TypeScript' : file.filename.includes('.js') ? 'JavaScript' : 'this file type'}`,
                  status: 'PENDING',
                },
                {
                  id: `${index}-3`,
                  description: 'Documentation is clear and sufficient',
                  status: 'OK',
                },
                {
                  id: `${index}-4`,
                  description: 'Error handling is robust and appropriate',
                  status: 'PENDING',
                },
              ],
            };
          }) || [],
      };
    };

    try {
      // 実際の API 呼び出しをダミーデータに置き換え
      return createDummyAnalysisResult();
    } catch (error) {
      console.error('Error in generateAnalysis fetcher:', error);
      throw error;
    }
  },
};
