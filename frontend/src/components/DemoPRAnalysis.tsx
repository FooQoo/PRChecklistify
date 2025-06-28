'use client';

import { useState } from 'react';
import { useCompletion } from 'ai/react';
import type { PRAnalysisResult, PRFile, Checklist, PRData } from '@extension/shared';
import { FileChecklist, MarkdownRenderer } from '@extension/ui';

interface DemoPRAnalysisProps {
  prData: PRData;
}

const DemoPRAnalysis: React.FC<DemoPRAnalysisProps> = ({ prData }) => {
  const [checklistAnalysis, setChecklistAnalysis] = useState<PRAnalysisResult['fileAnalysis'] | null>(null);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const {
    completion,
    isLoading: isSummaryLoading,
    error: summaryError,
    complete,
  } = useCompletion({
    api: '/api/summary',
    onError: err => {
      console.error('Summary generation error:', err);
      setAnalysisError(err.message);
    },
  });

  const handleGenerateSummary = () => {
    setAnalysisError(null);
    complete('', {
      body: {
        prData,
        language: 'ja',
      },
    });
  };

  const handleGenerateChecklist = async () => {
    setAnalysisError(null);
    setIsChecklistLoading(true);
    setChecklistAnalysis(null);
    try {
      const checklistResponse = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prData,
          language: 'ja',
        }),
      });
      if (!checklistResponse.ok) {
        const errorData = await checklistResponse.json();
        throw new Error(errorData.details || 'Failed to fetch checklist analysis.');
      }
      const result: { fileAnalysis: Checklist[] } = await checklistResponse.json();
      setChecklistAnalysis(result.fileAnalysis);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsChecklistLoading(false);
    }
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
          <button
            onClick={handleGenerateChecklist}
            disabled={isChecklistLoading}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm disabled:bg-gray-400">
            {isChecklistLoading ? 'Generating...' : checklistAnalysis ? 'Re-generate' : 'Generate Checklist'}
          </button>
        </div>
        {analysisError && !summaryError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{analysisError}</div>
        )}
        {checklistAnalysis ? (
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
                      analysisResult={analysisResultForFile}
                      isGenerating={isChecklistLoading}
                      error={analysisError}
                      generateChecklist={handleGenerateChecklist}
                      onChecklistChange={() => {
                        // In the demo, we don't need to handle this.
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {isChecklistLoading
              ? 'Generating checklist...'
              : "Click 'Generate Checklist' to get an AI-powered checklist."}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPRAnalysis;
