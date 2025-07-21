import type { PRIdentifier } from '../../types';
import type { GitLabServer } from '@extension/storage';
import { gitlabTokensStorage } from '@extension/storage';
import { loadGitLabServerConfig } from '../../utils/configLoader';

export class GitLabClient {
  private server: GitLabServer & { token?: string };

  private constructor(server: GitLabServer & { token?: string }) {
    this.server = server;
  }

  static async create(serverId: string): Promise<GitLabClient> {
    const servers = loadGitLabServerConfig();
    const targetServer = servers.find(s => s.id === serverId);
    if (!targetServer) {
      throw new Error('GitLab server config not found');
    }
    const token = await gitlabTokensStorage.getToken(serverId);
    if (!token) {
      throw new Error('GitLab token not found');
    }
    return new GitLabClient({ ...targetServer, token });
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.server.apiUrl}${path}`;
    const res = await fetch(url, {
      headers: {
        'PRIVATE-TOKEN': this.server.token!,
      },
    });
    if (!res.ok) {
      throw new Error(`GitLab API error: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async fetchPullRequest(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.request(`/projects/${encodeURIComponent(`${owner}/${repo}`)}/merge_requests/${prNumber}`);
  }

  async fetchPullRequestFiles(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.request(`/projects/${encodeURIComponent(`${owner}/${repo}`)}/merge_requests/${prNumber}/changes`);
  }

  async fetchFileContent(owner: string, repo: string, path: string) {
    return this.request(
      `/projects/${encodeURIComponent(`${owner}/${repo}`)}/repository/files/${encodeURIComponent(path)}/raw?ref=main`,
    );
  }

  async fetchInstructionsFromMain(owner: string, repo: string): Promise<string | undefined> {
    try {
      return await this.fetchFileContent(owner, repo, '.gitlab/copilot-instructions.md');
    } catch {
      return undefined;
    }
  }

  async fetchReadmeContent(owner: string, repo: string): Promise<string | undefined> {
    try {
      return await this.fetchFileContent(owner, repo, 'README.md');
    } catch {
      return undefined;
    }
  }

  async fetchBlob(owner: string, repo: string, file_sha: string) {
    return this.request(`/projects/${encodeURIComponent(`${owner}/${repo}`)}/repository/blobs/${file_sha}`);
  }

  async fetchPullRequestReviewComments(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.request(`/projects/${encodeURIComponent(`${owner}/${repo}`)}/merge_requests/${prNumber}/notes`);
  }
}
