import { Octokit } from '@octokit/rest';
import { githubTokenStorage, githubApiDomainStorage } from '@extension/storage';
import type { PRIdentifier } from '../types';

export class GithubClient {
  private octokit: Octokit;

  private constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  static async create() {
    const token = await githubTokenStorage.get();
    const apiDomain = (await githubApiDomainStorage.get()) || '';
    const octokit = new Octokit({
      auth: token || undefined,
      baseUrl: apiDomain || undefined,
    });
    return new GithubClient(octokit);
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

  async fetchPullRequestReviews(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.octokit.pulls.listReviews({ owner, repo, pull_number: Number(prNumber) });
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
    return atob(base64);
  }
}

let githubClientSingleton: GithubClient | null = null;

export const getGithubClient = async (): Promise<GithubClient> => {
  if (!githubClientSingleton) {
    githubClientSingleton = await GithubClient.create();
  }
  return githubClientSingleton;
};
