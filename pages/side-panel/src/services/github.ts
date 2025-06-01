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

  async fetchFileContent(owner: string, repo: string, path: string, ref: string) {
    return this.octokit.repos.getContent({ owner, repo, path, ref });
  }

  async fetchPullRequestReviews(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.octokit.pulls.listReviews({ owner, repo, pull_number: Number(prNumber) });
  }
}

let githubClientSingleton: GithubClient | null = null;

export const getGithubClient = async (): Promise<GithubClient> => {
  if (!githubClientSingleton) {
    githubClientSingleton = await GithubClient.create();
  }
  return githubClientSingleton;
};
