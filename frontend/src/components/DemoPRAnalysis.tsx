'use client';

import { useState } from 'react';
import { useCompletion } from 'ai/react';
import type { PRAnalysisResult, Checklist, PRData } from '@extension/shared';
import MarkdownRenderer from './MarkdownRenderer';
import FileChecklist from './FileChecklist';

interface DemoPRAnalysisProps {
  prData: PRData;
}

const DemoPRAnalysis: React.FC<DemoPRAnalysisProps> = ({ prData }) => {
  const [checklistAnalysis, setChecklistAnalysis] = useState<PRAnalysisResult['fileAnalysis'] | null>(null);

  const {
    completion,
    isLoading: isSummaryLoading,
    error: summaryError,
    complete,
  } = useCompletion({
    api: '/api/summary',
    onError: err => {
      console.error('Summary generation error:', err);
    },
  });

  const handleGenerateSummary = () => {
    complete('', {
      body: {
        prData,
        language: 'ja',
      },
    });
  };

  const handleChecklistChange = (filename: string, items: Record<string, 'PENDING' | 'OK' | 'NG'>) => {
    // In a real application, you would save this to a database or other persistent storage.
    console.log('Checklist changed for file:', filename, items);
  };

  const handleChecklistUpdate = (checklist: Checklist) => {
    setChecklistAnalysis(prev => {
      if (!prev) {
        return [checklist];
      }
      const existingIndex = prev.findIndex(item => item.filename === checklist.filename);
      if (existingIndex !== -1) {
        const newAnalysis = [...prev];
        newAnalysis[existingIndex] = checklist;
        return newAnalysis;
      }
      return [...prev, checklist];
    });
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="pr-analysis p-4 border border-gray-300 rounded-md bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">PR Summary</h3>
          <button
            onClick={handleGenerateSummary}
            disabled={isSummaryLoading}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm disabled:bg-gray-400">
            {isSummaryLoading ? 'Generating...' : completion ? 'Re-generate' : 'Generate Summary'}
          </button>
        </div>
        {summaryError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">
            {summaryError.message}
          </div>
        )}
        {completion ? (
          <div className="pr-summary mb-4">
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
              <MarkdownRenderer content={completion} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {isSummaryLoading ? 'Generating summary...' : "Click 'Generate Summary' to get an AI-powered summary."}
          </div>
        )}
      </div>

      <div className="pr-analysis p-4 border border-gray-300 rounded-md bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">PR Checklist</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 mt-4">
          <div className="changed-files w-full text-left">
            <div className="detailed-checklists">
              {prData.files.map(file => {
                const fileAnalysisForFile = checklistAnalysis?.find(fa => fa.filename === file.filename);
                const analysisResultForFile = fileAnalysisForFile
                  ? { summary: completion, fileAnalysis: [fileAnalysisForFile] }
                  : undefined;

                return (
                  <FileChecklist
                    key={file.filename}
                    file={file}
                    prData={prData}
                    analysisResult={analysisResultForFile}
                    onChecklistChange={handleChecklistChange}
                    onChecklistUpdate={handleChecklistUpdate}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPRAnalysis;
