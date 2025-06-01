import { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import type { ChecklistItemStatus, PRAnalysisResult, PRData } from '../types';
import type { Language } from '@extension/storage';
import { languagePreferenceStorage } from '@extension/storage';
import { fetchers } from '@src/services/aiService';
import FileChecklist from './FileChecklist';
import FileChatModal from './FileChatModal';
import { generatingAtom } from '@src/atoms/generatingAtom';

interface PRAnalysisProps {
  prData: PRData;
  analysisResult: PRAnalysisResult | undefined;
  saveAnalysisResult: (result: PRAnalysisResult | undefined) => void;
}

const PRAnalysis: React.FC<PRAnalysisProps> = ({ prData, analysisResult, saveAnalysisResult }) => {
  const [generating, setGenerating] = useAtom(generatingAtom);
  const [language, setLanguage] = useState<Language>('en'); // デフォルト言語を設定
  const [error, setError] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; message: string }[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pr_file_chat_histories');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const blockTimer = useRef<NodeJS.Timeout | null>(null);

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

  // ローディングアニメーション制御
  useEffect(() => {
    if (generating) {
      if (blockTimer.current) clearInterval(blockTimer.current);
      blockTimer.current = setInterval(() => {
        // ここでsetBlockActiveは不要なので何もしない
      }, 2000); // 2秒ごとに進める
    } else {
      if (blockTimer.current) clearInterval(blockTimer.current);
    }
    return () => {
      if (blockTimer.current) clearInterval(blockTimer.current);
    };
  }, [generating]);

  // PR説明文（summary）のみ生成（ストリームでテキストを受け取り、リアルタイム表示）
  const [streamedSummary, setStreamedSummary] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // summaryストリーム生成時はテキストを構造体にパースして保存
  const generateSummary = async () => {
    if (!prData || generating) return;
    setIsStreaming(true);
    setStreamedSummary('');
    setError(null);
    setGenerating(true);
    let streamed = '';
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
      saveAnalysisResult({
        summary: streamed,
        fileAnalysis: analysisResult?.fileAnalysis || [],
        prompt: streamed, // テキストも保存
      });
    } catch {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setGenerating(false);
      setIsStreaming(false);
    }
  };

  // 注意: generateChecklistForFile関数はFileChecklistコンポーネントに移動済み

  // チェックリスト変更時のハンドラー
  const handleChecklistChange = (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => {
    if (!prData || !analysisResult) return;

    // 分析結果のファイルチェックリストを更新する
    const updatedFileChecklists = analysisResult.fileAnalysis.map(checklist => {
      if (checklist.filename === filename) {
        // ステータスマッピングしたチェックリストアイテムを作成
        const updatedItems = checklist.checklistItems.map((item, index) => {
          const key = `item_${index}`;
          if (checklistItems[key]) {
            return { ...item, status: checklistItems[key] as ChecklistItemStatus };
          }
          return item;
        });
        return { ...checklist, checklistItems: updatedItems };
      }
      return checklist;
    });

    // 更新後の分析結果オブジェクトを作成
    const updatedAnalysisResult = {
      ...analysisResult,
      fileAnalysis: updatedFileChecklists,
    };

    // 分析結果を更新
    saveAnalysisResult(updatedAnalysisResult);
  };

  const displaySummary = (summary: string) => {
    return summary;
  };

  return (
    <>
      <div className="pr-analysis p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">PR Analysis</h3>
          {!generating && (
            <button
              onClick={generateSummary}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">
              {analysisResult?.summary ? 'Regenerate Summary' : 'Generate Summary'}
            </button>
          )}
        </div>
        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}
        {streamedSummary || analysisResult?.summary ? (
          <div className="pr-summary mb-4">
            <div className="bg-gray-50 p-3 rounded-md text-left text-sm whitespace-pre-line">
              {streamedSummary || displaySummary(analysisResult!.summary)}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {generating || isStreaming
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
              const aiGeneratedChecklist = analysisResult?.fileAnalysis?.find(
                checklist => checklist.filename === file.filename,
              );
              return (
                <div key={index} className="mb-2">
                  <FileChecklist
                    file={file}
                    onChecklistChange={handleChecklistChange}
                    aiGeneratedChecklist={aiGeneratedChecklist}
                    onOpenChat={() => setChatModalOpen(file.filename)}
                    prData={prData}
                    language={language}
                    onUpdateFileAnalysis={fileChecklist => {
                      // 既存のanalysisResultにfileAnalysisをマージ
                      const updatedFileAnalysis = [
                        ...(analysisResult?.fileAnalysis || []).filter(f => f.filename !== file.filename),
                        fileChecklist,
                      ];
                      saveAnalysisResult({
                        ...analysisResult,
                        fileAnalysis: updatedFileAnalysis,
                        summary: analysisResult?.summary || '',
                        prompt: analysisResult?.prompt || '',
                      });
                    }}
                  />
                  <FileChatModal
                    open={chatModalOpen === file.filename}
                    onClose={() => setChatModalOpen(null)}
                    file={file}
                    diff={file.patch || ''}
                    aiAnalysis={aiGeneratedChecklist}
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
                    status={null}
                    allDiffs={Object.fromEntries(prData.files.map(f => [f.filename, f.patch || '']))}
                    checklistItems={(() => {
                      if (!aiGeneratedChecklist) return undefined;
                      const items: Record<string, 'PENDING' | 'OK' | 'NG'> = {};
                      aiGeneratedChecklist.checklistItems.forEach((item, idx) => {
                        items[item.id || `item_${idx}`] = item.status as 'PENDING' | 'OK' | 'NG';
                      });
                      return items;
                    })()}
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
