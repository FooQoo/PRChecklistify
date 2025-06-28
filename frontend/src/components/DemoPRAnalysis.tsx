'use client';

import { useState } from 'react';
import type { PRAnalysisResult } from '../types';
// import MarkdownRenderer from './MarkdownRenderer';
// TODO: DemoFileChecklist を作成する
import DemoFileChecklist from './DemoFileChecklist';

// ダミーデータとダミー関数
const dummyPRFiles = [
  {
    filename: 'src/components/feature.tsx',
    status: 'modified',
    additions: 1,
    deletions: 1,
    patch: '@@ -1,1 +1,1 @@\n-Hello\n+Hello World',
    contents_url: '',
  },
  {
    filename: 'src/styles/main.css',
    status: 'added',
    additions: 1,
    deletions: 0,
    patch: '@@ -0,0 +1,1 @@\n+body { color: red; }',
    contents_url: '',
  },
];

const dummyAnalysisResult: PRAnalysisResult = {
  summary: 'This PR introduces a new feature and updates styles. The changes seem reasonable.',
  fileAnalysis: [
    {
      filename: 'src/components/feature.tsx',
      explanation: '',
      checklistItems: [
        { id: '1', description: 'Component logic is clear', status: 'PENDING' },
        { id: '2', description: 'Props are well-defined', status: 'PENDING' },
      ],
    },
    {
      filename: 'src/styles/main.css',
      explanation: '',
      checklistItems: [{ id: '3', description: 'Styles follow the design system', status: 'PENDING' }],
    },
  ],
};

const DemoPRAnalysis: React.FC = () => {
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PRAnalysisResult | null>(null);

  const generateSummary = async () => {
    if (summaryGenerating) return;
    setError(null);
    setSummaryGenerating(true);
    // ダミーの待機時間
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnalysisResult(dummyAnalysisResult);
    setSummaryGenerating(false);
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
              {/* <MarkdownRenderer content={analysisResult.summary} /> */}
              <p>{analysisResult.summary}</p>
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
              {dummyPRFiles.map(file => (
                <DemoFileChecklist key={file.filename} file={file} analysisResult={analysisResult} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DemoPRAnalysis;
