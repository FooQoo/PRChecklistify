import { Octokit } from '@octokit/rest';
import type { PRIdentifier } from '../../types';
import type { GitHubServer } from '@extension/storage';
import { githubTokensStorage } from '@extension/storage';
import { loadGitHubServerConfig } from '../../utils/configLoader';
import { GitHubError } from '@src/errors/GitHubError';

export class GithubClient {
  private octokit: Octokit;
  private server: GitHubServer & { token?: string };

  private constructor(octokit: Octokit, server: GitHubServer & { token?: string }) {
    this.octokit = octokit;
    this.server = server;
  }

  static async create(serverId: string): Promise<GithubClient> {
    let server: (GitHubServer & { token?: string }) | undefined;

    // Get specific server
    const servers = await loadGitHubServerConfig();
    const targetServer = servers.find(s => s.id === serverId);
    if (targetServer) {
      const token = await githubTokensStorage.getToken(serverId);
      server = { ...targetServer, token };
    }

    if (!server) {
      throw GitHubError.createServerConfigNotFoundError();
    }

    const octokit = new Octokit({
      auth: server.token || undefined,
      baseUrl: server.apiUrl,
      log: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    return new GithubClient(octokit, server);
  }

  private handleError(error: unknown): never {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      switch (status) {
        case 401:
          throw GitHubError.createTokenInvalidError(error);
        case 403:
          if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as { message: string }).message;
            if (message.includes('rate limit')) {
              throw GitHubError.createRateLimitError(error);
            }
          }
          throw GitHubError.createRepositoryAccessError(error);
        case 404:
          throw GitHubError.createFileNotFoundError(error);
        default:
          throw GitHubError.createApiError(error);
      }
    }
    throw GitHubError.createNetworkError(error);
  }

  getServer(): GitHubServer & { token?: string } {
    return this.server;
  }

  async fetchPullRequest(identifier: PRIdentifier) {
    try {
      const { owner, repo, prNumber } = identifier;
      return this.octokit.pulls.get({ owner, repo, pull_number: Number(prNumber) });
    } catch (error) {
      console.error('Error fetching pull request:', error);
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
        throw GitHubError.createPullRequestNotFoundError(error);
      }
      this.handleError(error);
    }
  }

  async fetchPullRequestFiles(identifier: PRIdentifier) {
    try {
      const { owner, repo, prNumber } = identifier;
      return this.octokit.pulls.listFiles({ owner, repo, pull_number: Number(prNumber) });
    } catch (error) {
      this.handleError(error);
    }
  }

  async fetchFileContent(owner: string, repo: string, path: string) {
    try {
      return this.octokit.repos.getContent({ owner, repo, path });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * mainブランチから .github/copilot-instructions.md の内容を取得する
   * @param owner リポジトリオーナー
   * @param repo リポジトリ名
   * @returns ファイル内容（string）またはnull（存在しない場合）
   */
  async fetchInstructionsFromMain(owner: string, repo: string): Promise<string | undefined> {
    try {
      const { data } = await this.fetchFileContent(owner, repo, '.github/copilot-instructions.md');
      if ('content' in data && typeof data.content === 'string') {
        const base64 = data.content.replace(/\n/g, '');
        return atob(base64);
      }
      return undefined;
    } catch (error) {
      if (GitHubError.isGitHubError(error) && error.i18nKey === 'githubFileNotFound') {
        return undefined;
      }
      throw error;
    }
  }

  // READMEファイルの内容を取得
  async fetchReadmeContent(owner: string, repo: string): Promise<string | undefined> {
    const readmeFiles = ['README.md', 'README.txt', 'README.rst', 'README'];

    for (const filename of readmeFiles) {
      try {
        const { data } = await this.fetchFileContent(owner, repo, filename);
        if ('content' in data && typeof data.content === 'string') {
          const base64 = data.content.replace(/\n/g, '');
          return atob(base64);
        }
      } catch (error) {
        // 404の場合は次のファイル名を試す
        if (GitHubError.isGitHubError(error) && error.i18nKey === 'githubFileNotFound') {
          continue;
        }
        // その他のエラーは再スロー
        throw error;
      }
    }

    // すべてのREADMEファイルが見つからない場合
    return undefined;
  }

  /**
   * 指定したSHAのblobを取得
   * @param owner リポジトリオーナー
   * @param repo リポジトリ名
   * @param file_sha ファイルのSHA
   */
  async fetchBlob(owner: string, repo: string, file_sha: string) {
    try {
      const blob = await this.octokit.git.getBlob({ owner, repo, file_sha });
      const base64 = blob.data.content.replace(/\n/g, '');
      const decodedContent = atob(base64);
      // 各行で200文字を超える場合はtruncateする
      return decodedContent
        .split('\n')
        .map(line => line.slice(0, 200))
        .join('\n');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * PRのレビューコメント（pulls.listReviewComments）を取得
   */
  async fetchPullRequestReviewComments(identifier: PRIdentifier) {
    try {
      const { owner, repo, prNumber } = identifier;
      return this.octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: Number(prNumber),
        per_page: 100,
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
