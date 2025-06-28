import type { GithubClient, PRIdentifier } from './github';
import type { PRData, PRFile, PRUserComment } from './types';

export const fetchPRData = async (github: GithubClient, identifier: PRIdentifier): Promise<PRData | null> => {
  try {
    const { owner, repo } = identifier;

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
          decodedContent,
        } as PRFile;
      }),
    );

    // レビューデータを取得
    let copilotInstructions = undefined;
    let readme = undefined;
    try {
      copilotInstructions = await github.fetchCopilotInstructionsFromMain(owner, repo);
      readme = await github.fetchReadmeContent(owner, repo);
    } catch (error) {
      console.warn('Failed to fetch PR reviews:', error);
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
      console.warn('Failed to fetch review comments:', e);
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
      copilot_instructions: copilotInstructions,
      readme,
      userComments, // ここでレビューコメントを格納
    };
  } catch (error) {
    console.error('Error fetching PR data:', error);
    return null;
  }
};
