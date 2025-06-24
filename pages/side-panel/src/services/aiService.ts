import type { PRData, PRFile } from '@src/types';
import { createModelClient } from './modelClient';
import { getLanguageLabel, type Language } from '@extension/storage';

// Add SWR fetchers for use with useSWR

export const fetchers = {
  // Fetcher for generating OpenAI analysis
  generateAnalysis: async (prData: PRData, file: PRFile, language: Language) => {
    try {
      // プロパティを確認して確実にPRDataがあることを確認
      if (!prData || !prData.files || !Array.isArray(prData.files)) {
        throw new Error('Invalid PR data provided');
      }

      // モデルクライアント（OpenAI/Gemini）を取得
      const client = await createModelClient();

      if (!client) {
        throw new Error('Failed to create model client');
      }

      // 選択されたAIプロバイダーでPRを分析
      const analysisResult = await client.analyzePR(prData, file, language);

      return analysisResult;
    } catch (error) {
      console.error('Error in generateAnalysis fetcher:', error);
      throw error;
    }
  },

  // ストリーミングでAIチャット応答を取得するfetcher
  fileChatStream: async (
    prData: PRData, // PR情報を追加
    file: PRFile,
    chatHistory: { sender: string; message: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
    allDiffs?: Record<string, string>,
  ) => {
    // PR情報をシステムプロンプトに含める
    const prInfo = `title: ${prData.title || ''}\ndescription: ${prData.body || ''}\nauthor: ${prData.user?.login || ''}`;
    const fileInfo = `\nfilename: ${file.filename}\ndiff:\n${file.patch || ''}\nfull code:\n${file.decodedContent || ''}`;
    const copilotInstructions = `\n--- Repository Information ---\n${prData.copilot_instructions || ''}`;
    const readme = `\n--- README Content ---\n${prData.readme || ''}`;
    // --- 追加: PRレビューコメントを整形して追記 ---
    let commentsText = '';
    if (prData.userComments && prData.userComments.length > 0) {
      commentsText =
        '\n--- Review Comments (for reviewer context) ---\n' +
        prData.userComments
          .map(c => `- [${c.user.login} at ${c.created_at}]: ${c.body.replace(/\n/g, ' ')} (file: ${c.path})`)
          .join('\n');
    }
    let allDiffsInfo = '';
    if (allDiffs) {
      allDiffsInfo =
        '\n--- all diff ---\n' +
        Object.entries(allDiffs)
          .map(([fname, diff]) => `【${fname}】\n${diff}`)
          .join('\n\n');
    }
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: `You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback as an AI reviewer.\n${prInfo}${fileInfo}${allDiffsInfo}${copilotInstructions}${readme}${commentsText}`,
      },
      ...chatHistory.map((msg): { role: 'user' | 'assistant'; content: string } => ({
        role: msg.sender === 'You' ? 'user' : 'assistant',
        content: msg.message,
      })),
    ];

    const client = await createModelClient();
    if (!client) throw new Error('Failed to create model client');
    await client.streamChatCompletion(messages, onToken, options);
  },

  // ファイルごとのチェックリストのみ生成
  generateChecklist: async (prData: PRData, file: PRFile, _language: Language) => {
    try {
      if (!prData || !file) throw new Error('Invalid PR data or file');
      const client = await createModelClient();
      if (!client) throw new Error('Failed to create model client');
      return await client.analyzePR(prData, file, _language);
    } catch (error) {
      console.error('Error in generateChecklist fetcher:', error);
      throw error;
    }
  },

  // PR説明文のみ生成（ストリーム対応・テキスト出力）
  generateSummaryStream: async (
    prData: PRData,
    _language: Language,
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ) => {
    try {
      if (!prData) throw new Error('Invalid PR data provided');
      const client = await createModelClient();
      if (!client) throw new Error('Failed to create model client');
      const diff = prData.files.map(file => file.patch || '').join('\n\n');
      // --- 追加: PRレビューコメントを整形して追記 ---
      let commentsText = '';
      if (prData.userComments && prData.userComments.length > 0) {
        commentsText =
          '\n--- Review Comments (for reviewer context) ---\n' +
          prData.userComments
            .map(c => `- [${c.user.login} at ${c.created_at}]: ${c.body.replace(/\n/g, ' ')}`)
            .join('\n');
      }
      const mergeStatus = prData.merged_at ? 'merged' : prData.closed_at ? 'closed' : 'open';
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: 'system',
          content: `This is a pull request summary generation task. You will generate a concise summary of the pull request content in ${getLanguageLabel(_language)}.\n\nPR Author: ${prData.user?.login || 'Unknown'}\nPR Title: ${prData.title}\nPR Description: ${prData.body}\nPR diff: ${diff}\nRepository README: ${prData.readme || ''}\nRepository information: ${prData.copilot_instructions || ''}\nPR Merge Status: ${mergeStatus}${commentsText}`,
        },
        {
          role: 'user',
          content: `Summarize the content of this pull request concisely from the following five perspectives: Background & Problem, Solution & Implementation, and Review Comments.\n\nFor the 'Review Comments' section, output a "Review Highlight Timeline".\n- Instead of listing every event, summarize the review activity for each day.\n- For each day, provide a brief summary of the main review points, status changes, and any important feedback.\n- Clearly indicate the current review status (e.g., "in review", "changes requested", "approved", etc.).\n- If possible, infer the overall review progress and any blockers.\n- Output should be easy to read as a daily timeline for the team to quickly grasp the review situation.`,
        },
      ];
      await client.streamChatCompletion(messages, onToken, options);
    } catch (error) {
      console.error('Error in generateSummaryStream fetcher:', error);
      throw error;
    }
  },
};
