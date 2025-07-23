import type { PRData, PRFile, PRIdentifier } from '@src/types';
import type { GithubClient } from '@src/repositories/github/github';
import { GitHubError } from '@src/errors/GitHubError';
import { instructionPathStorage } from '@extension/storage';

/**
 * Service to fetch PR data from GitHub
 */
export class PRDataService {
  private githubFactory: (serverId: string) => Promise<GithubClient>;
  private getServerIdFn: (domain: string) => Promise<string>;

  constructor(
    githubFactory: (serverId: string) => Promise<GithubClient>,
    getServerIdFn: (domain: string) => Promise<string>,
  ) {
    this.githubFactory = githubFactory;
    this.getServerIdFn = getServerIdFn;
  }

  async fetchPRData(identifier: PRIdentifier): Promise<PRData> {
    try {
      // ドメインからサーバーIDを取得してGitHubクライアントを作成
      const serverId = await this.getServerIdFn(identifier.domain);
      const github: GithubClient = await this.githubFactory(serverId);
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
            const contentUrlParts = file.contents_url.split('/contents/');
            if (contentUrlParts.length > 1) {
              decodedContent = await github.fetchBlob(owner, repo, file.sha);
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
      try {
        readme = await github.fetchReadmeContent(owner, repo);
      } catch {
        readme = undefined;
      }

      const { data: reviewCommentsData } = await github.fetchPullRequestReviewComments(identifier);

      const userComments = reviewCommentsData.map(comment => ({
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
      throw GitHubError.create(error);
    }
  }
}
