import type { PRData, PRAnalysisResult } from '@src/types';

// Add SWR fetchers for use with useSWR

export const fetchers = {
  // Fetcher for generating OpenAI analysis
  generateAnalysis: async (key: string, prData: PRData, language: string) => {
    console.log('Generating OpenAI analysis with SWR:', key);

    // ダミーの分析結果データを作成する関数
    const createDummyAnalysisResult = (): PRAnalysisResult => {
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

    try {
      // 実際の API 呼び出しをダミーデータに置き換え
      return createDummyAnalysisResult();
    } catch (error) {
      console.error('Error in generateAnalysis fetcher:', error);
      throw error;
    }
  },
};
