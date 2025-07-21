import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFetchPRData } from '../../pages/side-panel/src/services/prDataService';

const stubClient = {
  fetchPullRequest: async () => ({
    data: {
      id: 1,
      number: 1,
      title: 't',
      state: 'open',
      body: '',
      html_url: '',
      user: { login: 'u', avatar_url: '' },
      created_at: '',
      updated_at: '',
      closed_at: null,
      merged_at: null,
      merge_commit_sha: '',
      base: { ref: '', sha: '' },
      head: { ref: '', sha: '' },
      additions: 0,
      deletions: 0,
      changed_files: 0,
      commits: 0,
      comments: 0,
      review_comments: 0,
    },
  }),
  fetchPullRequestFiles: async () => ({ data: [] }),
  fetchBlob: async () => '',
  fetchFileContent: async () => ({ data: { content: Buffer.from('x').toString('base64') } }),
  fetchReadmeContent: async () => 'readme',
  fetchPullRequestReviewComments: async () => ({ data: [] }),
};

const factory = async () => stubClient as any;
const serverIdFn = async () => 'server';

const fetchPRData = createFetchPRData(factory, serverIdFn);

test('fetchPRData uses injected github client', async () => {
  const data = await fetchPRData({ owner: 'o', repo: 'r', prNumber: '1', domain: 'd' });
  assert.equal(data.title, 't');
});
