import type React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useI18n } from '@extension/i18n';

interface PRSummarySectionProps {
  summary?: string;
  streamedSummary?: string;
  isStreaming: boolean;
  summaryGenerating: boolean;
  onGenerateSummary: () => void;
  error?: string | null;
}

const PRSummarySection: React.FC<PRSummarySectionProps> = ({
  summary,
  streamedSummary,
  isStreaming,
  summaryGenerating,
  onGenerateSummary,
  error,
}) => {
  const { t } = useI18n();

  return (
    <div className="pr-analysis p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">{t('prAnalysisTitle')}</h3>
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
            onClick={onGenerateSummary}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">
            {summary || streamedSummary ? t('syncLatestCommit') : t('generateSummary')}
          </button>
        )}
      </div>
      {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}
      {streamedSummary || summary ? (
        <div className="pr-summary mb-4">
          <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
            <MarkdownRenderer content={streamedSummary || summary!} />
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
          {summaryGenerating || isStreaming ? t('analyzingPr') : t('clickGenerateSummary')}
        </div>
      )}
    </div>
  );
};

export default PRSummarySection;
