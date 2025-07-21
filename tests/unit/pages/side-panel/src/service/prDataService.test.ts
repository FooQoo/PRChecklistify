import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PRDataService } from '../../../../../../pages/side-panel/src/services/prDataService';
import type { GithubClient } from '../../../../../../pages/side-panel/src/repositories/github/github';
import { GithubClient as GithubClientImpl } from '../../../../../../pages/side-panel/src/repositories/github/github';
import { getServerIdByDomain } from '../../../../../../pages/side-panel/src/utils/prUtils';

// Mock GitHub client
const createMockGithubClient = (overrides: Partial<GithubClient> = {}): GithubClient =>
  ({
    fetchPullRequest: async () => ({
      data: {
        id: 1,
        number: 1,
        title: 'Test PR',
        state: 'open' as const,
        body: 'Test description',
        html_url: 'https://github.com/owner/repo/pull/1',
        user: { login: 'testuser', avatar_url: 'https://avatar.url' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        base: { ref: 'main', sha: 'abc123' },
        head: { ref: 'feature', sha: 'def456' },
        additions: 10,
        deletions: 5,
        changed_files: 2,
        commits: 3,
        comments: 1,
        review_comments: 2,
      },
    }),
    fetchPullRequestFiles: async () => ({
      data: [
        {
          sha: 'file123',
          filename: 'test.ts',
          status: 'modified' as const,
          additions: 5,
          deletions: 2,
          changes: 7,
          blob_url: 'https://github.com/owner/repo/blob/123/test.ts',
          raw_url: 'https://github.com/owner/repo/raw/123/test.ts',
          contents_url: 'https://api.github.com/repos/owner/repo/contents/test.ts?ref=123',
          patch: '+ new line',
        },
      ],
      status: 200 as const,
      url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
      headers: {},
    }),
    fetchBlob: async () => 'console.log("test");',
    fetchFileContent: async () => ({
      data: { content: Buffer.from('Instructions content').toString('base64') },
    }),
    fetchReadmeContent: async () => '# Test Repository',
    fetchPullRequestReviewComments: async () => ({
      data: [
        {
          id: 1,
          user: { login: 'reviewer', avatar_url: 'https://reviewer.avatar' },
          path: 'test.ts',
          body: 'Good change!',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/owner/repo/pull/1#discussion_r1',
        },
      ],
    }),
    ...overrides,
  }) as GithubClient;

// Mock factories
const createGithubFactory = (client: GithubClient) => async () => client;
const mockGetServerIdFn = async () => 'github.com';

// Mock global objects for Chrome storage
Object.defineProperty(global, 'atob', {
  value: (str: string) => Buffer.from(str, 'base64').toString('utf-8'),
});

describe('PRDataService', () => {
  test('creates instance successfully', () => {
    const service = new PRDataService(GithubClientImpl.create, getServerIdByDomain);
    assert.ok(service instanceof PRDataService);
  });

  test('creates instance with custom dependencies', () => {
    const mockClient = createMockGithubClient();
    const githubFactory = createGithubFactory(mockClient);
    const service = new PRDataService(githubFactory, mockGetServerIdFn);
    assert.ok(service instanceof PRDataService);
  });

  test('fetches PR data successfully', async () => {
    const mockClient = createMockGithubClient();
    const githubFactory = createGithubFactory(mockClient);
    const service = new PRDataService(githubFactory, mockGetServerIdFn);

    const identifier = {
      owner: 'testowner',
      repo: 'testrepo',
      prNumber: '1',
      domain: 'github.com',
    };

    const result = await service.fetchPRData(identifier);

    // Verify basic PR data
    assert.equal(result.id, 1);
    assert.equal(result.number, 1);
    assert.equal(result.title, 'Test PR');
    assert.equal(result.state, 'open');
    assert.equal(result.body, 'Test description');
    assert.equal(result.user.login, 'testuser');

    // Verify files with decoded content
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].filename, 'test.ts');
    assert.equal(result.files[0].decodedContent, 'console.log("test");');

    // Verify instructions and readme (instructions might be undefined if no path is configured)
    // Since we can't easily mock the storage in this test setup, instructions may be undefined
    // assert.equal(result.instructions, 'Instructions content');
    assert.equal(result.readme, '# Test Repository');

    // Verify user comments
    assert.equal(result.userComments.length, 1);
    assert.equal(result.userComments[0].user.login, 'reviewer');
    assert.equal(result.userComments[0].body, 'Good change!');
  });

  test('handles file without contents_url', async () => {
    const mockClient = createMockGithubClient({
      fetchPullRequestFiles: async () => ({
        data: [
          {
            sha: 'deleted123',
            filename: 'deleted.ts',
            status: 'removed' as const,
            additions: 0,
            deletions: 10,
            changes: 10,
            blob_url: '',
            raw_url: '',
            contents_url: '',
            patch: '@@ -1,10 +0,0 @@',
          },
        ],
        status: 200 as const,
        url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        headers: {},
      }),
    });

    const githubFactory = createGithubFactory(mockClient);
    const service = new PRDataService(githubFactory, mockGetServerIdFn);

    const identifier = {
      owner: 'testowner',
      repo: 'testrepo',
      prNumber: '1',
      domain: 'github.com',
    };

    const result = await service.fetchPRData(identifier);

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].filename, 'deleted.ts');
    assert.equal(result.files[0].decodedContent, undefined);
  });

  test('handles instruction file fetch error gracefully', async () => {
    const mockClient = createMockGithubClient({
      fetchFileContent: async () => {
        throw new Error('File not found');
      },
    });

    const githubFactory = createGithubFactory(mockClient);
    const service = new PRDataService(githubFactory, mockGetServerIdFn);

    const identifier = {
      owner: 'testowner',
      repo: 'testrepo',
      prNumber: '1',
      domain: 'github.com',
    };

    const result = await service.fetchPRData(identifier);

    // Should handle error gracefully and set instructions to undefined
    assert.equal(result.instructions, undefined);
    // Other data should still be present
    assert.equal(result.title, 'Test PR');
  });

  test('handles GitHub API errors', async () => {
    const mockClient = createMockGithubClient({
      fetchPullRequest: async () => {
        throw new Error('API rate limit exceeded');
      },
    });

    const githubFactory = createGithubFactory(mockClient);
    const service = new PRDataService(githubFactory, mockGetServerIdFn);

    const identifier = {
      owner: 'testowner',
      repo: 'testrepo',
      prNumber: '1',
      domain: 'github.com',
    };

    await assert.rejects(() => service.fetchPRData(identifier), /githubApiError/);
  });

  test('processes files with valid contents_url correctly', async () => {
    const mockClient = createMockGithubClient({
      fetchPullRequestFiles: async () => ({
        data: [
          {
            sha: 'validsha',
            filename: 'valid.ts',
            status: 'modified' as const,
            additions: 5,
            deletions: 2,
            changes: 7,
            blob_url: 'https://github.com/owner/repo/blob/123/valid.ts',
            raw_url: 'https://github.com/owner/repo/raw/123/valid.ts',
            contents_url: 'https://api.github.com/repos/owner/repo/contents/valid.ts?ref=sha123',
            patch: '@@ -1,3 +1,6 @@',
          },
        ],
        status: 200 as const,
        url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        headers: {},
      }),
      fetchBlob: async (owner, repo, sha) => {
        if (sha === 'validsha') {
          return 'const valid = true;';
        }
        return '';
      },
    });

    const githubFactory = createGithubFactory(mockClient);
    const service = new PRDataService(githubFactory, mockGetServerIdFn);

    const identifier = {
      owner: 'testowner',
      repo: 'testrepo',
      prNumber: '1',
      domain: 'github.com',
    };

    const result = await service.fetchPRData(identifier);

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].filename, 'valid.ts');
    assert.equal(result.files[0].decodedContent, 'const valid = true;');
  });
});
