import { useState, useEffect } from 'react';
import type { PRData } from '../types';
import { usePRData } from '../hooks/usePRData';
import { languagePreferenceStorage } from '@extension/storage';

interface PRAnalysisProps {
  prData: PRData;
  url: string;
}

const PRAnalysis: React.FC<PRAnalysisProps> = ({ prData }) => {
  const { analysisResult, updateAnalysisResult } = usePRData();
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
      const generatedAnalysis = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prData, language }),
      }).then(res => {
        if (!res.ok) {
          throw new Error('Analysis generation failed');
        }
        return res.json();
      });

      // 分析結果を更新
      updateAnalysisResult(generatedAnalysis);
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
            <h4 className="text-md font-semibold mb-2">Summary</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="mb-2">
                <span className="font-medium">Background:</span> {analysisResult.summary.background}
              </div>
              <div className="mb-2">
                <span className="font-medium">Problem:</span> {analysisResult.summary.problem}
              </div>
              <div className="mb-2">
                <span className="font-medium">Solution:</span> {analysisResult.summary.solution}
              </div>
              <div>
                <span className="font-medium">Implementation:</span> {analysisResult.summary.implementation}
              </div>
            </div>
          </div>

          <div className="checklist-overview mb-4">
            <h4 className="text-md font-semibold mb-2">Review Progress</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-xl font-bold">{prData.files.length}</div>
                <div className="text-xs text-gray-500">Total Files</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-xl font-bold">
                  {
                    analysisResult.fileChecklists.filter(checklist =>
                      checklist.checklistItems.some(item => item.status !== 'PENDING'),
                    ).length
                  }
                </div>
                <div className="text-xs text-gray-500">Files Reviewed</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-xl font-bold">
                  {
                    analysisResult.fileChecklists.filter(checklist =>
                      checklist.checklistItems.every(item => item.status === 'OK'),
                    ).length
                  }
                </div>
                <div className="text-xs text-gray-500">Files Approved</div>
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
