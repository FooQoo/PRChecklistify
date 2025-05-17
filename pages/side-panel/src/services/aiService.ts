import type { PRData, PRFile } from '@src/types';
import { createOpenAIClient } from './openai';

// Add SWR fetchers for use with useSWR

export const fetchers = {
  // Fetcher for generating OpenAI analysis
  generateAnalysis: async (key: string, prData: PRData, language: string) => {
    console.log('Generating OpenAI analysis with SWR:', key);
    console.log(`Using language for analysis: ${language}`);

    /**
     * const createDummyAnalysisResult = (): PRAnalysisResult => {
      return {
        summary: {
          background:
            'This PR implements a new feature that allows users to filter search results by various criteria.',
          problem: 'Users were having difficulty finding relevant items in large search result sets.',
          solution: 'Add filter controls that allow narrowing results by category, date, and other attributes.',
          implementation:
            'Implemented filter components in React with state management using Context API. Backend API was extended to support filter parameters.',
        },
        fileChecklists:
          prData?.files.map((file, index) => {
            return {
              id: `file-${index}`, // 必須の id プロパティを追加
              filename: file.filename,
              explanation: `Checklist for ${file.filename.split('/').pop()}`,
              checklistItems: [
                {
                  id: `${index}-1`,
                  description: `Code is well-formatted and consistent with project style in ${file.filename.split('/').pop()}`,
                  status: 'PENDING',
                },
                {
                  id: `${index}-2`,
                  description: `Implementation follows best practices for ${file.filename.includes('.ts') ? 'TypeScript' : file.filename.includes('.js') ? 'JavaScript' : 'this file type'}`,
                  status: 'PENDING',
                },
                {
                  id: `${index}-3`,
                  description: 'Documentation is clear and sufficient',
                  status: 'OK',
                },
                {
                  id: `${index}-4`,
                  description: 'Error handling is robust and appropriate',
                  status: 'PENDING',
                },
              ],
            };
          }) || [],
      };
    };
     */

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
};
