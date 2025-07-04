import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import type { ChecklistItemStatus, Checklist, PRAnalysisResult, PRData } from '../types';
import type { Language } from '@extension/storage';
import { defaultLanguage, languagePreferenceStorage } from '@extension/storage';
import { fetchers } from '@src/services/aiService';
import FileChatModal from './FileChatModal';
import { generatingAtom } from '@src/atoms/generatingAtom';
import FileChecklist from './FileChecklist';
import { MarkdownRenderer } from './MarkdownRenderer';

interface PRAnalysisProps {
  prData: PRData;
  analysisResult: PRAnalysisResult | undefined;
  refreshData: () => Promise<void>; // PRデータを再読み込みする関数
  saveAnalysisResultSummary: (summary: string) => Promise<void>;
  saveAnalysisResultChecklist: (fileChecklist: Checklist) => Promise<void>;
}

const PRAnalysis: React.FC<PRAnalysisProps> = ({
  prData,
  analysisResult,
  refreshData,
  saveAnalysisResultSummary,
  saveAnalysisResultChecklist,
}) => {
  const [, setGenerating] = useAtom(generatingAtom);
  // summaryのgenerateを管理
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [language, setLanguage] = useState<Language>(defaultLanguage); // デフォルト言語を設定
  const [error, setError] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; message: string }[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pr_file_chat_histories');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

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

  // チャット履歴をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('pr_file_chat_histories', JSON.stringify(chatHistories));
  }, [chatHistories]);

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
      await fetchers.generateSummaryStream(
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
    } catch {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setGenerating(false);
      setSummaryGenerating(false);
      setIsStreaming(false);
    }
  };

  // チェックリスト変更時のハンドラー
  const handleChecklistChange = (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => {
    if (!prData || !analysisResult) return;

    // 分析結果のファイルチェックリストを更新する
    const updatedFileChecklists = analysisResult.fileAnalysis
      .filter(checklist => checklist.filename === filename)
      .map(checklist => {
        // ステータスマッピングしたチェックリストアイテムを作成
        const updatedItems = checklist.checklistItems.map((item, index) => {
          const key = `item_${index}`;
          if (checklistItems[key]) {
            return { ...item, status: checklistItems[key] as ChecklistItemStatus };
          }
          return item;
        });
        return { ...checklist, checklistItems: updatedItems };
      });

    // 分析結果を更新
    saveAnalysisResultChecklist(updatedFileChecklists[0]);
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
              {analysisResult?.summary || streamedSummary ? 'Sync latest commit' : 'Generate Summary'}
            </button>
          )}
        </div>
        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}
        {streamedSummary || analysisResult?.summary ? (
          <div className="pr-summary mb-4">
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
              <MarkdownRenderer content={streamedSummary || analysisResult!.summary} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {summaryGenerating || isStreaming
              ? 'Analyzing your PR. This may take a moment...'
              : "Click 'Generate Summary' to get AI-powered summary about this PR."}
          </div>
        )}
      </div>
      {/* ファイルリストは常に表示 */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        <div className="changed-files p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm w-full text-left">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Changed Files</h3>
          </div>
          <div className="detailed-checklists">
            {prData.files.map((file, index) => {
              return (
                <div key={index} className="mb-2">
                  <FileChecklist
                    file={file}
                    onChecklistChange={handleChecklistChange}
                    analysisResult={analysisResult}
                    onOpenChat={() => setChatModalOpen(file.filename)}
                    prData={prData}
                    language={language}
                    saveAnalysisResultChecklist={saveAnalysisResultChecklist}
                  />
                  <FileChatModal
                    open={chatModalOpen === file.filename}
                    onClose={() => setChatModalOpen(null)}
                    file={file}
                    chatHistory={chatHistories[file.filename] || []}
                    onResetChat={() => {
                      setChatHistories(prev => ({
                        ...prev,
                        [file.filename]: [],
                      }));
                    }}
                    onSendMessage={async (
                      msg: string,
                      streamOpts?: { onToken?: (token: string) => void; signal?: AbortSignal; onDone?: () => void },
                      context?: { allDiffs?: Record<string, string> },
                    ) => {
                      setChatHistories(prev => ({
                        ...prev,
                        [file.filename]: [...(prev[file.filename] || []), { sender: 'You', message: msg }],
                      }));
                      let aiMsg = '';
                      try {
                        await fetchers.fileChatStream(
                          prData,
                          file,
                          [...(chatHistories[file.filename] || []), { sender: 'You', message: msg }],
                          (token: string) => {
                            aiMsg += token;
                            if (streamOpts?.onToken) streamOpts.onToken(token);
                          },
                          language,
                          { signal: streamOpts?.signal },
                          context?.allDiffs,
                        );
                        setChatHistories(prev => ({
                          ...prev,
                          [file.filename]: [...(prev[file.filename] || []), { sender: 'AI', message: aiMsg }],
                        }));
                      } catch {
                        setChatHistories(prev => ({
                          ...prev,
                          [file.filename]: [
                            ...(prev[file.filename] || []),
                            { sender: 'AI', message: aiMsg || '（AI応答が中断されました）' },
                          ],
                        }));
                      } finally {
                        if (streamOpts?.onDone) streamOpts.onDone();
                      }
                    }}
                    allDiffs={Object.fromEntries(prData.files.map(f => [f.filename, f.patch || '']))}
                    analysisResult={analysisResult}
                    onChecklistChange={checklistItems => handleChecklistChange(file.filename, checklistItems)}
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
