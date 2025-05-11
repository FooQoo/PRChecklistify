import { useState, useEffect } from 'react';
import type { PRData } from '../types';
import { usePRData } from '../hooks/usePRData';
import { languagePreferenceStorage } from '@extension/storage';
import { fetchers } from '@src/services/prDataService';

interface PRAnalysisProps {
  prData: PRData;
  url: string;
}

const PRAnalysis: React.FC<PRAnalysisProps> = ({ prData, url }) => {
  const { analysisResult, saveAnalysisResult } = usePRData();
  const [generating, setGenerating] = useState(false);
  const [language, setLanguage] = useState<string>('en');
  const [error, setError] = useState<string | null>(null);

  // 言語設定を読み込む
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await languagePreferenceStorage.get();
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    };

    loadLanguage();
  }, []);

  // AI分析を生成する
  const generateAnalysis = async () => {
    if (!prData || generating) return;

    try {
      setGenerating(true);
      setError(null);

      // Generate analysis using the fetcher
      const generatedAnalysis = await fetchers.generateAnalysis(url, prData, language);

      // デバッグ用
      console.log('Generated analysis result:', generatedAnalysis);

      // 分析結果を更新
      saveAnalysisResult(generatedAnalysis);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!prData) {
    return null;
  }

  return (
    <div className="pr-analysis p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">PR Analysis</h3>
        {!analysisResult && !generating && (
          <button
            onClick={generateAnalysis}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">
            Generate Analysis
          </button>
        )}
        {generating && (
          <div className="flex items-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating...</span>
          </div>
        )}
      </div>

      {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}

      {analysisResult ? (
        <div>
          <div className="pr-summary mb-4">
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm">
              <div className="mb-2">
                <span className="font-medium">Background:</span>{' '}
                <span className="font-normal">{analysisResult.summary.background}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Problem:</span>{' '}
                <span className="font-normal">{analysisResult.summary.problem}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Solution:</span>{' '}
                <span className="font-normal">{analysisResult.summary.solution}</span>
              </div>
              <div>
                <span className="font-medium">Implementation:</span>{' '}
                <span className="font-normal">{analysisResult.summary.implementation}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
          {generating
            ? 'Analyzing your PR. This may take a moment...'
            : "Click 'Generate Analysis' to get AI-powered insights about this PR."}
        </div>
      )}
    </div>
  );
};

export default PRAnalysis;
