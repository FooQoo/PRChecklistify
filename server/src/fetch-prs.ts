import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import type { PrData, PrComment } from './types.js';
import { buildPrText, getEmbeddingFromText } from './semanticSearch.js';

function extractOrgRepoFromUrl(url: string): { domain: string; org: string; repo: string } | null {
  // 例: https://github.com/org/repo, https://github.example.com/org/repo, https://github.com/org/repo.git
  const match = url.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?(?:[/?#]|$)/);
  if (match) {
    return { domain: match[1], org: match[2], repo: match[3] };
  }
  return null;
}

const program = new Command();

program
  .command('fetch-prs')
  .description('Fetch all PR metadata and associated comments from a GitHub repository and save as JSONL')
  .requiredOption('--url <url>', 'GitHub repository URL (e.g. https://github.com/org/repo)')
  .requiredOption('--token <token>', 'GitHub API token')
  .option('--output <path>', 'Output file path', path.join(process.cwd(), 'prs.jsonl'))
  .option('--max-pr <number>', 'Maximum number of PRs to fetch (default: 300)', v => parseInt(v, 10), 300)
  .action(async opts => {
    const token = opts.token;
    const outputPath = opts.output;
    const maxPR: number = opts.maxPr;

    console.info(`Fetching PRs from ${opts.url}`);
    console.info(`Output will be saved to: ${outputPath}`);
    console.info(`Maximum PRs to fetch: ${maxPR}`);

    const parsed = extractOrgRepoFromUrl(opts.url);
    if (!parsed) {
      throw new Error('Invalid GitHub repository URL');
    }
    const { domain, org, repo } = parsed;

    if (!org || !repo || !token) {
      throw new Error('urlとtokenは必須です');
    }

    // baseUrlの決定
    let baseUrl: string | undefined = undefined;
    if (domain !== 'github.com') {
      baseUrl = `https://${domain}/api/v3`;
    }
    const octokit = new Octokit({ auth: token, ...(baseUrl ? { baseUrl } : {}) });

    // PR一覧を取得
    let page = 1;
    const allPrData: PrData[] = [];
    let fetchedPRs = 0;
    while (true) {
      const res = await octokit.pulls.list({
        owner: org,
        repo,
        state: 'all',
        per_page: 100,
        page,
      });
      if (res.data.length === 0) break;
      for (const pr of res.data) {
        if (maxPR && fetchedPRs >= maxPR) break;
        // ファイル差分情報を取得
        const filesRes = await octokit.pulls.listFiles({
          owner: org,
          repo,
          pull_number: pr.number,
          per_page: 100,
        });
        const files = filesRes.data.map(f => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch,
        }));

        // コメント取得
        const reviewCommentsRes = await octokit.pulls.listReviewComments({
          owner: org,
          repo,
          pull_number: pr.number,
          per_page: 100,
        });
        const issueCommentsRes = await octokit.issues.listComments({
          owner: org,
          repo,
          issue_number: pr.number,
          per_page: 100,
        });
        const comments: PrComment[] = [
          ...reviewCommentsRes.data.map(comment => ({
            domain,
            org,
            repo,
            pr_id: pr.number,
            body: comment.body || '',
            author: comment.user?.login || null,
            created_at: comment.created_at,
            line: typeof comment.line === 'number' ? comment.line : null,
            filename: comment.path || null,
          })),
          ...issueCommentsRes.data.map(comment => ({
            domain,
            org,
            repo,
            pr_id: pr.number,
            body: comment.body || '',
            author: comment.user?.login || null,
            created_at: comment.created_at,
            line: null,
            filename: null,
          })),
        ];

        // text組み立て
        const text = buildPrText({ title: pr.title, body: pr.body || '', files: files.map(f => f.filename) });

        let embedding: number[];
        try {
          const embeddingResult = await getEmbeddingFromText(text);
          embedding = embeddingResult;
        } catch (err) {
          throw new Error(`Failed to generate embedding for PR #${pr.number}: ${err}`);
        }

        const prInfo: PrData = {
          domain,
          org,
          repo,
          pr_id: pr.number,
          title: pr.title,
          body: pr.body || '',
          author: pr.user?.login || null,
          created_at: pr.created_at,
          merged: pr.merged_at !== null,
          merged_at: pr.merged_at || null,
          state: pr.state,
          comments,
          files,
          embedding,
          text,
        };

        allPrData.push(prInfo);
        fetchedPRs++;
        console.log(`Progress: ${fetchedPRs} PRs processed`);
      }
      if (fetchedPRs >= maxPR) break;
      page++;
    }
    fs.writeFileSync(outputPath, allPrData.map(c => JSON.stringify(c)).join('\n'));
    console.log(`✅ Saved ${allPrData.length} PR metadata entries to ${outputPath}`);
  });

program.parse();
