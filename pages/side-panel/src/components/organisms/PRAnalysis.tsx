import { useState } from 'react';
import { useAtom } from 'jotai';
import type { Checklist, PRAnalysisResult, PRData } from '@src/types';
import { aiService } from '@src/di';
import FileChatModal from './FileChatModal';
import { generatingAtom } from '@src/atoms/generatingAtom';
import FileChecklist from './FileChecklist';
import { PRSummarySection } from '@src/components/molecules';
import { useI18n } from '@extension/i18n';
import { getLocalizedErrorMessage } from '@src/utils/errorUtils';

interface PRAnalysisProps {
  prData: PRData;
  analysisResult: PRAnalysisResult | null;
  prKey: string;
  refreshData: () => Promise<void>; // PRデータを再読み込みする関数
  saveAnalysisResultSummary: (summary: string) => Promise<void>;
  saveAnalysisResultChecklist: (fileChecklist: Checklist) => Promise<void>;
  updateFileClose: (filename: string, isClose: boolean) => Promise<void>;
}

const PRAnalysis: React.FC<PRAnalysisProps> = ({
  prData,
  analysisResult,
  prKey,
  refreshData,
  saveAnalysisResultSummary,
  saveAnalysisResultChecklist,
  updateFileClose,
}) => {
  const [, setGenerating] = useAtom(generatingAtom);
  // summaryのgenerateを管理
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const { language, t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);

  // PR説明文（summary）のみ生成（ストリームでテキストを受け取り、リアルタイム表示）
  const [streamedSummary, setStreamedSummary] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // summaryストリーム生成時はテキストを構造体にパースして保存
  const generateSummary = async () => {
    if (!prData || summaryGenerating) return;
    setIsStreaming(true);
    setStreamedSummary('starting...');
    setError(null);
    setGenerating(true);
    setSummaryGenerating(true);
    let streamed = '';
    await refreshData();
    try {
      await aiService.streamPRSummary(
        prData,
        language,
        (token: string) => {
          streamed += token;
          setStreamedSummary(streamed);
        },
        {
          signal: undefined,
        },
      );
      // ストリーム完了後に保存（文字列として）
      saveAnalysisResultSummary(streamed);
    } catch (error) {
      setError(getLocalizedErrorMessage(error, t));
    } finally {
      setGenerating(false);
      setSummaryGenerating(false);
      setIsStreaming(false);
    }
  };

  // チェックリスト変更時のハンドラー
  const handleChecklistChange = (filename: string, updatedChecklist: Checklist) => {
    if (!prData || !analysisResult) return;

    const fileChecklistIndex = analysisResult.fileAnalysis?.findIndex(c => c.filename === filename);
    if (fileChecklistIndex === -1 || fileChecklistIndex === undefined) return;

    // 分析結果を更新
    saveAnalysisResultChecklist(updatedChecklist);
  };

  return (
    <>
      <PRSummarySection
        summary={analysisResult?.summary}
        streamedSummary={streamedSummary}
        isStreaming={isStreaming}
        summaryGenerating={summaryGenerating}
        onGenerateSummary={generateSummary}
        error={error}
        prBody={prData.body}
      />
      {/* ファイルリストは常に表示 */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        <div className="changed-files p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm w-full text-left">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">{t('changedFiles')}</h3>
          </div>
          <div className="detailed-checklists">
            {prData.files.map((file, index) => {
              return (
                <div key={index} className="mb-2">
                  <FileChecklist
                    file={file}
                    onChecklistChange={handleChecklistChange}
                    analysisResult={analysisResult}
                    updateFileClose={updateFileClose}
                    onOpenChat={() => {
                      setChatModalOpen(file.filename);
                    }}
                    prData={prData}
                    language={language}
                    saveAnalysisResultChecklist={saveAnalysisResultChecklist}
                  />
                  <FileChatModal
                    open={chatModalOpen === file.filename}
                    onClose={() => setChatModalOpen(null)}
                    file={file}
                    prKey={prKey}
                    prData={prData}
                    analysisResult={analysisResult}
                    onChecklistChange={updatedChecklist => handleChecklistChange(file.filename, updatedChecklist)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default PRAnalysis;
