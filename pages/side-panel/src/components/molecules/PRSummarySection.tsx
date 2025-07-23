import type React from 'react';
import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useI18n } from '@extension/i18n';

interface PRSummarySectionProps {
  summary?: string;
  streamedSummary?: string;
  isStreaming: boolean;
  summaryGenerating: boolean;
  onGenerateSummary: () => void;
  error: string | null;
  prBody: string | null;
}

const PRSummarySection: React.FC<PRSummarySectionProps> = ({
  summary,
  streamedSummary,
  isStreaming,
  summaryGenerating,
  onGenerateSummary,
  error,
  prBody,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'summary' | 'description'>('summary');

  // サマリがある時のみタブ表示
  const hasSummary = !!(streamedSummary || summary);
  const hasBody = !!prBody;

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
      {error && (
        <div
          className={`p-3 border rounded-md mb-3 ${
            error.includes(t('githubRateLimitError'))
              ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
              : 'bg-red-100 border-red-300 text-red-800'
          }`}>
          {error.includes(t('githubRateLimitError')) && (
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Rate Limit Exceeded</span>
            </div>
          )}
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}
      {/* タブ表示（サマリがある場合のみ） */}
      {hasSummary && hasBody && (
        <div className="flex border-b border-gray-200 mb-3">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t('summaryTab')}
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'description'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t('descriptionTab')}
          </button>
        </div>
      )}

      {/* コンテンツ表示 */}
      {hasSummary ? (
        <div className="pr-summary mb-4">
          {hasSummary && hasBody ? (
            // タブがある場合は選択されたタブのコンテンツを表示
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
              <MarkdownRenderer content={activeTab === 'summary' ? streamedSummary || summary! : prBody!} />
            </div>
          ) : (
            // サマリしかない場合はサマリを表示
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
              <MarkdownRenderer content={streamedSummary || summary!} />
            </div>
          )}
        </div>
      ) : prBody ? (
        // サマリがない場合はPR本文を表示
        <div className="pr-summary mb-4">
          <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
            <MarkdownRenderer content={prBody} />
          </div>
        </div>
      ) : (
        // 何もない場合は空の状態を表示
        <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
          {summaryGenerating || isStreaming ? t('analyzingPr') : t('clickGenerateSummary')}
        </div>
      )}
    </div>
  );
};

export default PRSummarySection;
