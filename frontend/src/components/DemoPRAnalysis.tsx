'use client';

import { useState } from 'react';
import type { PRAnalysisResult, PRFile } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import DemoFileChecklist from './DemoFileChecklist';

const DemoPRAnalysis: React.FC = () => {
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PRAnalysisResult | null>(null);

  // APIから分析結果を取得する関数
  const generateSummary = async () => {
    if (summaryGenerating) return;
    setError(null);
    setSummaryGenerating(true);

    try {
      const response = await fetch('/api/analyze-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ボディは空でもOK（API側でダミーデータを使うため）
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis.');
      }

      const result: PRAnalysisResult = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setSummaryGenerating(false);
    }
  };

  return (
    <>
      <div className="pr-analysis p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">PR Analysis</h3>
          {summaryGenerating ? (
            <div className="flex items-center justify-center h-8 w-8">
              <svg
                className="animate-spin h-6 w-6 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </div>
          ) : (
            <button
              onClick={generateSummary}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">
              {analysisResult ? 'Re-generate Analysis' : 'Generate Analysis'}
            </button>
          )}
        </div>
        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}
        {analysisResult?.summary ? (
          <div className="pr-summary mb-4">
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
              <MarkdownRenderer content={analysisResult.summary} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {summaryGenerating
              ? 'Analyzing your PR. This may take a moment...'
              : "Click 'Generate Analysis' to get an AI-powered summary."}
          </div>
        )}
      </div>
      {analysisResult && (
        <div className="grid grid-cols-1 gap-2 mt-4">
          <div className="changed-files p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm w-full text-left">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Changed Files</h3>
            </div>
            <div className="detailed-checklists">
              {analysisResult.fileAnalysis.map(fileAnalysis => (
                <DemoFileChecklist
                  key={fileAnalysis.filename}
                  file={{ filename: fileAnalysis.filename } as PRFile}
                  analysisResult={analysisResult}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DemoPRAnalysis;
