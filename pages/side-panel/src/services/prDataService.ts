/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-catch */
import type { PRData, SavedPRData, PRAnalysisResult, PRFile, PRIdentifier, PRUserComment } from '../types';
import { GithubClient } from './github';
import { instructionPathStorage } from '@extension/storage';
import { getServerIdByDomain } from '../utils/prUtils';

type RecentPR = { title: string; key: string; timestamp: number };

// PRデータをローカルストレージに保存・取得するためのユーティリティ
class PRDataStorage {
  private readonly STORAGE_KEY = 'prDataCache';
  private readonly MAX_CACHE_SIZE = 20; // 最大キャッシュ数

  // PRデータのみを保存
  async savePRDataToStorage(prKey: string, prData: PRData): Promise<void> {
    try {
      const savedData = await this.getAllFromStorage();
      const existingIndex = savedData.findIndex(item => item.key === prKey);
      let analysisResult = undefined;
      if (existingIndex >= 0) {
        analysisResult = savedData[existingIndex].analysisResult;
        savedData[existingIndex] = {
          key: prKey,
          data: prData,
          timestamp: Date.now(),
          analysisResult,
        };
      } else {
        // キャッシュサイズが最大に達していれば、最も古いものを削除
        if (savedData.length >= this.MAX_CACHE_SIZE) {
          savedData.sort((a, b) => b.timestamp - a.timestamp);
          savedData.pop();
        }
        savedData.push({
          key: prKey,
          data: prData,
          timestamp: Date.now(),
          analysisResult: undefined,
        });
      }
      await chrome.storage.local.set({ [this.STORAGE_KEY]: savedData });
      await this.updateRecentPRs(prData.title, prKey);
    } catch (error) {
      throw error;
    }
  }

  // analysisResultのみを保存
  async saveAnalysisResultToStorage(prKey: string, analysisResult: PRAnalysisResult): Promise<void> {
    try {
      const savedData = await this.getAllFromStorage();
      const existingIndex = savedData.findIndex(item => item.key === prKey);
      if (existingIndex >= 0) {
        const prev = savedData[existingIndex];
        savedData[existingIndex] = {
          ...prev,
          analysisResult,
          timestamp: Date.now(),
        };
        await chrome.storage.local.set({ [this.STORAGE_KEY]: savedData });
      }
    } catch (error) {
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
      return null;
    }
  }

  // すべてのPRデータを取得
  async getAllFromStorage(): Promise<SavedPRData[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
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
        recentPRs[existingIndex] = newPRInfo;
      } else {
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
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }
}

// シングルトンとしてエクスポート
export const prDataStorage = new PRDataStorage();

// Service to fetch PR data from GitHub
export const fetchPRData = async (identifier: PRIdentifier): Promise<PRData | null> => {
  try {
    // ドメインベースでGitHubサーバーを自動切り替え
    if (identifier.domain) {
      try {
        const serverId = await getServerIdByDomain(identifier.domain);

        if (serverId) {
          // 現在のアクティブサーバーIDを取得
          const result = await chrome.storage.local.get('activeServerId');
          const currentActiveServerId = result.activeServerId;

          if (serverId !== currentActiveServerId) {
            console.log(`Auto-switching to server ${serverId} for domain ${identifier.domain}`);
            // アクティブサーバーIDを更新
            await chrome.storage.local.set({ activeServerId: serverId });
          }
        }
      } catch (error) {
        console.error('Failed to auto-switch GitHub server:', error);
      }
    }

    const github = await GithubClient.create();
    const { owner, repo } = identifier;

    // PRデータ取得
    const { data: prData } = await github.fetchPullRequest(identifier);

    // 変更されたファイル一覧を取得
    const { data: filesData } = await github.fetchPullRequestFiles(identifier);

    // 各ファイルのcontents_urlからbase64デコードした内容を取得
    const filesWithDecodedContent = await Promise.all(
      filesData.map(async file => {
        let decodedContent;
        if (file.contents_url) {
          try {
            const contentUrlParts = file.contents_url.split('/contents/');
            if (contentUrlParts.length > 1) {
              try {
                decodedContent = await github.fetchBlob(owner, repo, file.sha);
              } catch (e) {
                /* empty */
              }
            }
          } catch (e) {
            /* empty */
          }
        }
        return {
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
          contents_url: file.contents_url,
          decodedContent,
        } as PRFile;
      }),
    );

    // レビューデータを取得
    let instructions = undefined;
    let readme = undefined;
    try {
      const customPath = await instructionPathStorage.get();
      if (customPath) {
        try {
          const { data } = await github.fetchFileContent(owner, repo, customPath);
          if ('content' in data && typeof data.content === 'string') {
            const base64 = data.content.replace(/\n/g, '');
            instructions = atob(base64);
          }
        } catch {
          instructions = undefined;
        }
      }
      readme = await github.fetchReadmeContent(owner, repo);
    } catch (error) {
      /* empty */
    }

    // PRレビューコメント（pulls.listReviewComments）を取得
    let userComments: PRUserComment[] = [];
    try {
      const { data: reviewCommentsData } = await github.fetchPullRequestReviewComments(identifier);

      userComments = reviewCommentsData.map(comment => ({
        id: comment.id,
        user: {
          login: comment.user?.login || '',
          avatar_url: comment.user?.avatar_url || '',
        },
        path: comment.path || '',
        body: comment.body || '',
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        url: comment.html_url,
      }));
    } catch (e) {
      /* empty */
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
      instructions,
      readme,
      userComments, // ここでレビューコメントを格納
    };
  } catch (error) {
    return null;
  }
};
