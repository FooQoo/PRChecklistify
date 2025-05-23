import type { PRData, SavedPRData, PRAnalysisResult, PRFile, PRIdentifier } from '../types';
import { githubTokenStorage, githubApiDomainStorage } from '@extension/storage';
import { Octokit } from '@octokit/rest';

type RecentPR = { title: string; key: string; timestamp: number };

// PRデータをローカルストレージに保存・取得するためのユーティリティ
class PRDataStorage {
  private readonly STORAGE_KEY = 'pr_data_cache';
  private readonly MAX_CACHE_SIZE = 20; // 最大キャッシュ数

  // PRデータを保存
  async saveToStorage(prKey: string, prData: PRData, analysisResult?: PRAnalysisResult): Promise<void> {
    try {
      // 現在のキャッシュを取得
      const savedData = await this.getAllFromStorage();

      // 新しいPRデータを作成
      const newPRData: SavedPRData = {
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
      await this.updateRecentPRs(prData.title, prKey);
    } catch (error) {
      console.error('Error saving PR data to storage:', error);
      throw error;
    }
  }

  // 特定のPRデータを取得
  async getFromStorage(prKey: string): Promise<SavedPRData | null> {
    try {
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
  async removeFromStorage(prKey: string): Promise<void> {
    try {
      const savedData = await this.getAllFromStorage();
      // キーでフィルタリング
      const filteredData = savedData.filter(item => item.key !== prKey);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: filteredData });
    } catch (error) {
      console.error('Error removing PR data from storage:', error);
      throw error;
    }
  }

  // 最近表示したPRの履歴を更新
  private async updateRecentPRs(title: string, prKey: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get('recentPRs');
      const recentPRs = result.recentPRs || [];

      // 新しいPR情報
      const newPRInfo = {
        title,
        key: prKey, // キーを追加
        timestamp: Date.now(),
      } as RecentPR;

      // 既存のエントリーを確認（キーで検索）
      const existingIndex = recentPRs.findIndex((pr: RecentPR) => {
        return pr.key === prKey;
      });

      if (existingIndex >= 0) {
        // 既存のものを更新
        console.log(`Updating existing PR in history: ${prKey}`);
        recentPRs[existingIndex] = newPRInfo;
      } else {
        console.log(`Adding new PR to history: ${prKey}`);
        // 新しいものを追加（最大10件まで）
        if (recentPRs.length >= 10) {
          // タイムスタンプで並べ替えて古いものを削除
          recentPRs.sort((a: RecentPR, b: RecentPR) => b.timestamp - a.timestamp);
          recentPRs.pop();
        }

        recentPRs.push(newPRInfo);
      }

      // 最後にタイムスタンプでソートして保存
      recentPRs.sort((a: RecentPR, b: RecentPR) => b.timestamp - a.timestamp);
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

    // Octokitインスタンスを初期化
    const octokit = new Octokit({
      auth: token || undefined,
      baseUrl: apiDomain || undefined,
    });

    if (token) {
      console.log('Using GitHub PAT for API requests');
    } else {
      console.log('No GitHub PAT found, API requests may be rate limited');
    }

    console.log(`Using GitHub API domain: ${apiDomain}`);

    // Octokitを使用してPRデータを取得
    const { data: prData } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: Number(prNumber),
    });

    // 変更されたファイル一覧を取得
    const { data: filesData } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: Number(prNumber),
    });

    // --- ここから追加 ---
    // 各ファイルのcontents_urlからbase64デコードした内容を取得
    const filesWithDecodedContent = await Promise.all(
      filesData.map(async file => {
        let decodedContent;
        if (file.contents_url) {
          try {
            // URLからパスを抽出
            const contentUrlParts = file.contents_url.split('/contents/');
            if (contentUrlParts.length > 1) {
              const path = decodeURIComponent(contentUrlParts[1]);

              try {
                const { data: contentData } = await octokit.repos.getContent({
                  owner,
                  repo,
                  path,
                  ref: prData.head.sha,
                });

                if ('content' in contentData && !Array.isArray(contentData)) {
                  // 改行を除去してbase64デコード
                  const base64 = contentData.content.replace(/\n/g, '');
                  decodedContent = atob(base64);
                }
              } catch (e) {
                console.warn('Failed to get content for file:', file.filename, e);
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
    let reviewAssignedAt = null;

    try {
      const { data: reviewsData } = await octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: Number(prNumber),
      });

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
    } catch (error) {
      console.warn('Failed to fetch PR reviews:', error);
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
