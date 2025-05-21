import { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import type { ChecklistItemStatus, PRAnalysisResult, PRData } from '../types';
import { languagePreferenceStorage } from '@extension/storage';
import { fetchers } from '@src/services/aiService';
import FileChecklist from './FileChecklist';
import FileChatModal from './FileChatModal';
import { generatingAtom } from '@src/atoms/generatingAtom';

interface PRAnalysisProps {
  prData: PRData;
  analysisResult: PRAnalysisResult | undefined;
  saveAnalysisResult: (result: PRAnalysisResult | undefined) => void;
  reloadPRData?: () => Promise<PRData | null>; // 追加
}

const BLOCK_COLS = 10;
const BLOCK_ROWS = 3;
const BLOCK_TOTAL = BLOCK_COLS * BLOCK_ROWS;

const PRAnalysis: React.FC<PRAnalysisProps> = ({ prData, analysisResult, saveAnalysisResult, reloadPRData }) => {
  const [generating, setGenerating] = useAtom(generatingAtom);
  const [language, setLanguage] = useState<string>('en');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; message: string }[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pr_file_chat_histories');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [blockActive, setBlockActive] = useState(0);
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
      setBlockActive(0);
      blockTimer.current = setInterval(() => {
        setBlockActive(prev => (prev + 1) % (BLOCK_TOTAL + 1));
      }, 2000); // 2秒ごとに進める
    } else {
      setBlockActive(0);
      if (blockTimer.current) clearInterval(blockTimer.current);
    }
    return () => {
      if (blockTimer.current) clearInterval(blockTimer.current);
    };
  }, [generating]);

  // AI分析を生成する
  const generateAnalysis = async () => {
    if (!prData || generating) return;

    try {
      setGenerating(true);
      setError(null);
      saveAnalysisResult(undefined); // Reset analysis result

      let latestPRData = prData;
      if (reloadPRData) {
        const reloaded = await reloadPRData();
        if (reloaded) latestPRData = reloaded;
      }

      // 最新のprDataで分析
      const generatedAnalysis = await fetchers.generateAnalysis(latestPRData, language);

      // デバッグ用
      console.log('Generated analysis result:', generatedAnalysis);

      // 分析結果を更新
      saveAnalysisResult(generatedAnalysis);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

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

  // プロンプトをクリップボードにコピーする関数
  const copyPromptToClipboard = async () => {
    if (!analysisResult?.prompt) return;

    try {
      await navigator.clipboard.writeText(analysisResult.prompt);
      setCopySuccess(true);

      // 3秒後にコピー成功表示を消す
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy prompt to clipboard:', err);
      setError('クリップボードへのコピーに失敗しました。');
    }
  };

  return (
    <>
      <div className="pr-analysis p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">PR Analysis</h3>
          {!generating && (
            <button
              onClick={generateAnalysis}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">
              {!analysisResult ? 'Generate Analysis' : 'Regenerate Analysis'}
            </button>
          )}
        </div>

        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3">{error}</div>}

        {analysisResult ? (
          <div>
            <div className="pr-summary mb-4">
              <div className="bg-gray-50 p-3 rounded-md text-left text-sm">
                <div className="mb-2">
                  <span className="font-medium">Background:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.background}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Problem:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.problem}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Solution:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.solution}</span>
                </div>
                <div>
                  <span className="font-medium">Implementation:</span>{' '}
                  <span className="font-normal">{analysisResult.summary.implementation}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
            {generating ? (
              <>
                <div>Analyzing your PR. This may take a moment...</div>
                <div className="w-full flex justify-center mt-4">
                  <div
                    className="grid gap-1 w-full"
                    style={{
                      gridTemplateColumns: `repeat(${BLOCK_COLS}, 1fr)`,
                      gridTemplateRows: `repeat(${BLOCK_ROWS}, 16px)`,
                    }}>
                    {Array.from({ length: blockActive }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm bg-blue-500 transition-all duration-300"
                        style={{ width: '100%', height: 16 }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              "Click 'Generate Analysis' to get AI-powered insights about this PR. This may take about 30sec ~ 60sec"
            )}
          </div>
        )}

        {/* プロンプトコピーボタン */}
        {analysisResult?.prompt && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={copyPromptToClipboard}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              {copySuccess ? 'コピーしました！' : 'プロンプトをコピー'}
            </button>
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
              {prData.files.map((file, index) => {
                const aiGeneratedChecklist = analysisResult?.fileAnalysis.find(
                  checklist => checklist.filename === file.filename,
                );
                return (
                  <div key={index} className="mb-2">
                    <FileChecklist
                      file={file}
                      onChecklistChange={handleChecklistChange}
                      aiGeneratedChecklist={aiGeneratedChecklist}
                      onOpenChat={() => setChatModalOpen(file.filename)}
                    />
                    <FileChatModal
                      open={chatModalOpen === file.filename}
                      onClose={() => setChatModalOpen(null)}
                      file={file}
                      diff={file.patch || ''}
                      aiAnalysis={aiGeneratedChecklist}
                      chatHistory={chatHistories[file.filename] || []}
                      onResetChat={() => {
                        // ファイルのチャット履歴をリセット
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
                          // エラーは無視する
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
                      // ここで全ファイルのdiffを渡す
                      allDiffs={Object.fromEntries(prData.files.map(f => [f.filename, f.patch || '']))}
                      // チェックリスト状態と変更用コールバックを渡す
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
      )}
    </>
  );
};

export default PRAnalysis;
