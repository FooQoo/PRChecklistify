import { Octokit } from '@octokit/rest';

export interface PRIdentifier {
  owner: string;
  repo: string;
  prNumber: number;
}

export class GithubClient {
  private octokit: Octokit;

  constructor(authToken: string) {
    this.octokit = new Octokit({
      auth: authToken,
      baseUrl: process.env.GITHUB_API_DOMAIN || 'https://api.github.com',
      log: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });
  }

  async fetchPullRequest(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.octokit.pulls.get({ owner, repo, pull_number: Number(prNumber) });
  }

  async fetchPullRequestFiles(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.octokit.pulls.listFiles({ owner, repo, pull_number: Number(prNumber) });
  }

  async fetchFileContent(owner: string, repo: string, path: string) {
    return this.octokit.repos.getContent({ owner, repo, path });
  }

  /**
   * mainブランチから .github/copilot-instructions.md の内容を取得する
   * @param owner リポジトリオーナー
   * @param repo リポジトリ名
   * @returns ファイル内容（string）またはnull（存在しない場合）
   */
  async fetchCopilotInstructionsFromMain(owner: string, repo: string): Promise<string | undefined> {
    try {
      const { data } = await this.fetchFileContent(owner, repo, '.github/copilot-instructions.md');
      if ('content' in data && typeof data.content === 'string') {
        const base64 = data.content.replace(/\n/g, '');
        return atob(base64);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  // READMEファイルの内容を取得
  async fetchReadmeContent(owner: string, repo: string): Promise<string | undefined> {
    try {
      const { data } = await this.fetchFileContent(owner, repo, 'README.md');
      if ('content' in data && typeof data.content === 'string') {
        const base64 = data.content.replace(/\n/g, '');
        return atob(base64);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 指定したSHAのblobを取得
   * @param owner リポジトリオーナー
   * @param repo リポジトリ名
   * @param file_sha ファイルのSHA
   */
  async fetchBlob(owner: string, repo: string, file_sha: string) {
    const blob = await this.octokit.git.getBlob({ owner, repo, file_sha });
    const base64 = blob.data.content.replace(/\n/g, '');
    const decodedContent = atob(base64);
    // 各行で200文字を超える場合はtruncateする
    return decodedContent
      .split('\n')
      .map(line => line.slice(0, 200))
      .join('\n');
  }

  /**
   * PRのレビューコメント（pulls.listReviewComments）を取得
   */
  async fetchPullRequestReviewComments(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: Number(prNumber),
      per_page: 100,
    });
  }
}
