import type { PRData, PRFile } from '@src/types';
import { createOpenAIClient } from './openai';
import type { Language } from '@extension/storage';

// Add SWR fetchers for use with useSWR

export const fetchers = {
  // Fetcher for generating OpenAI analysis
  generateAnalysis: async (prData: PRData, language: Language) => {
    try {
      // プロパティを確認して確実にPRDataがあることを確認
      if (!prData || !prData.files || !Array.isArray(prData.files)) {
        throw new Error('Invalid PR data provided');
      }

      // OpenAIクライアントを取得
      const client = await createOpenAIClient();

      if (!client) {
        throw new Error('Failed to create OpenAI client');
      }

      // OpenAIを使用してPRを分析
      const analysisResult = await client.analyzePR(prData, language);

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
    const prInfo = `PRタイトル: ${prData.title || ''}\nPR説明: ${prData.body || ''}\n作成者: ${prData.user?.login || ''}`;
    const fileInfo = `\n対象ファイル: ${file.filename}\n差分:\n${file.patch || ''}\n修正後のコード:\n${file.decodedContent || ''}`;
    let allDiffsInfo = '';
    if (allDiffs) {
      allDiffsInfo =
        '\n--- 全ファイルのdiff一覧 ---\n' +
        Object.entries(allDiffs)
          .map(([fname, diff]) => `【${fname}】\n${diff}`)
          .join('\n\n');
    }
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: `You are a senior software developer conducting a thorough code review. You provide detailed, actionable feedback as an AI reviewer.\n${prInfo}${fileInfo}${allDiffsInfo}`,
      },
      ...chatHistory.map((msg): { role: 'user' | 'assistant'; content: string } => ({
        role: msg.sender === 'You' ? 'user' : 'assistant',
        content: msg.message,
      })),
    ];
    const client = await createOpenAIClient();
    if (!client) throw new Error('Failed to create OpenAI client');
    await client.streamChatCompletion(messages, onToken, options);
  },

  // PR説明文のみ生成
  generateSummary: async (prData: PRData, _language: string) => {
    try {
      if (!prData) throw new Error('Invalid PR data provided');
      const client = await createOpenAIClient();
      if (!client) throw new Error('Failed to create OpenAI client');

      let summaryText = '';
      const prompt = `このPRの内容を簡潔に日本語で要約してください。\n\nPRタイトル: ${prData.title}\nPR説明: ${prData.body}\n出力言語：${_language}\n\n【出力フォーマット】\n背景: ...\n課題: ...\n解決策: ...\n実装: ...`;

      await client.streamChatCompletion(
        [{ role: 'user', content: prompt }],
        (token: string) => {
          summaryText += token;
        },
        {},
      );

      return summaryText;
    } catch (error) {
      console.error('Error in generateSummary fetcher:', error);
      throw error;
    }
  },

  // ファイルごとのチェックリストのみ生成
  generateChecklist: async (prData: PRData, file: PRFile, _language: Language) => {
    try {
      if (!prData || !file) throw new Error('Invalid PR data or file');
      const client = await createOpenAIClient();
      if (!client) throw new Error('Failed to create OpenAI client');
      // checklistのみを生成するプロンプトを作成
      // analyzePRを使い、対象ファイルのみでPRDataを構成
      const tempResult = await client.analyzePR({ ...prData, files: [file] }, _language);
      // 1ファイル分だけ返す
      return tempResult.fileAnalysis[0];
    } catch (error) {
      console.error('Error in generateChecklist fetcher:', error);
      throw error;
    }
  },

  // PR説明文のみ生成（ストリーム対応・テキスト出力）
  generateSummaryStream: async (
    prData: PRData,
    _language: string,
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ) => {
    try {
      if (!prData) throw new Error('Invalid PR data provided');
      const client = await createOpenAIClient();
      if (!client) throw new Error('Failed to create OpenAI client');
      // summaryのみを生成するプロンプト（テキストで返すよう指示）
      const prompt = `このPRの内容を、背景・課題・解決策・実装の4つの観点で、簡潔に日本語で要約してください。\n\n【出力フォーマット】\n背景: ...\n課題: ...\n解決策: ...\n実装: ...\n\nPRタイトル: ${prData.title}\nPR説明: ${prData.body}`;
      await client.streamChatCompletion([{ role: 'user', content: prompt }], onToken, options);
    } catch (error) {
      console.error('Error in generateSummaryStream fetcher:', error);
      throw error;
    }
  },
};
