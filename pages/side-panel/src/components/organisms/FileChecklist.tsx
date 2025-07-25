import { useState, useEffect, useMemo, useRef } from 'react';
import type { PRData, Checklist, PRAnalysisResult } from '../../types';
import { useSetAtom } from 'jotai';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { aiService } from '@src/di';
import type { Language } from '@extension/storage';
import { MarkdownRenderer, ChecklistComponent } from '../molecules';
import { useI18n } from '@extension/i18n';
import { getLocalizedErrorMessage } from '@src/utils/errorUtils';

interface FileChecklistProps {
  file: PRData['files'][0];
  onChecklistChange: (filename: string, updatedChecklist: Checklist) => void;
  analysisResult: PRAnalysisResult | null;
  updateFileClose: (filename: string, isClose: boolean) => Promise<void>;
  onOpenChat?: () => void;
  prData: PRData;
  language: Language;
  saveAnalysisResultChecklist: (fileChecklist: Checklist) => Promise<void>;
}

const BLOCK_COLS = 10;
const BLOCK_ROWS = 3;
const BLOCK_TOTAL = BLOCK_COLS * BLOCK_ROWS;

const FileChecklist = ({
  file,
  onChecklistChange,
  analysisResult,
  updateFileClose,
  onOpenChat,
  prData,
  language,
  saveAnalysisResultChecklist,
}: FileChecklistProps) => {
  const [generating, setGenerating] = useState(false);
  const setGlobalGenerating = useSetAtom(generatingAtom);
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [blockActive, setBlockActive] = useState(0);
  const blockTimer = useRef<NodeJS.Timeout | null>(null);

  const aiGeneratedChecklist = useMemo(() => {
    return analysisResult?.fileAnalysis?.find(item => item.filename === file.filename);
  }, [analysisResult, file.filename]);

  // Check if checklist content is empty (no explanation and no checklist items)
  const isChecklistContentEmpty = (checklist: typeof aiGeneratedChecklist): boolean => {
    if (!checklist) return true;
    return !checklist.explanation && checklist.checklistItems.length === 0;
  };

  // Override to force expanded state (when user clicks to manually open/close)
  const [expandOverride, setExpandOverride] = useState<boolean | null>(null);
  // Track if all items were just checked to trigger auto-collapse
  const [allItemsJustChecked, setAllItemsJustChecked] = useState(false);

  // Initialize the allItemsJustChecked state based on initial checklist items
  useEffect(() => {
    if (aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0) {
      const allInitialItemsOK = aiGeneratedChecklist.checklistItems.every(item => item.isChecked);
      setAllItemsJustChecked(allInitialItemsOK);
    }
  }, [aiGeneratedChecklist]);

  // Calculate review status based on isClose flag and checklist items
  const getReviewStatus = (): 'approved' | 'reviewing' | 'not-reviewed' => {
    // チェックリストが存在する場合
    if (aiGeneratedChecklist) {
      // isClose が true の場合は承認
      if (aiGeneratedChecklist.isClose) {
        return 'approved';
      }

      // チェックリストアイテムがない場合
      if (aiGeneratedChecklist.checklistItems.length === 0) {
        return 'not-reviewed';
      }

      // isClose が false でもすべてのチェックリストアイテムが完了している場合は承認
      const allOK = aiGeneratedChecklist.checklistItems.every(item => item.isChecked);
      const anyReviewed = aiGeneratedChecklist.checklistItems.some(item => item.isChecked);

      if (allOK) {
        return 'approved';
      } else if (anyReviewed) {
        return 'reviewing';
      } else {
        return 'not-reviewed';
      }
    }

    // チェックリストが存在しない場合は未レビュー
    return 'not-reviewed';
  };

  // Calculate if expanded based on isClose flag and fallback logic
  const getCalculatedExpandedState = (): boolean => {
    // If user has explicitly set expand state via override, use that
    if (expandOverride !== null) {
      return expandOverride;
    }

    // If there's a checklist with isClose flag, use it
    if (aiGeneratedChecklist && aiGeneratedChecklist.isClose !== undefined) {
      return !aiGeneratedChecklist.isClose; // expanded = !isClose
    }

    // If there are no checklist items yet, keep expanded
    if (!aiGeneratedChecklist || aiGeneratedChecklist.checklistItems.length === 0) {
      return true;
    }

    const allOK = aiGeneratedChecklist.checklistItems.every(item => item.isChecked);

    // If all checks are OK, collapse it
    if (allOK && allItemsJustChecked) {
      return false;
    }

    // Not reviewed items should be expanded by default
    if (getReviewStatus() === 'not-reviewed') {
      return true;
    }

    // In progress items should be expanded
    if (getReviewStatus() === 'reviewing') {
      return true;
    }

    return false; // Approved items default to collapsed
  };

  // Computed expanded state
  const expanded = getCalculatedExpandedState();

  // Auto-collapse when all items are checked
  useEffect(() => {
    if (aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0) {
      const allOK = aiGeneratedChecklist.checklistItems.every(item => item.isChecked);

      if (allOK && !allItemsJustChecked) {
        setAllItemsJustChecked(true);
        // Reset the override when items are all OK
        setExpandOverride(null);
      } else if (!allOK) {
        setAllItemsJustChecked(false);
      }
    }
  }, [aiGeneratedChecklist, allItemsJustChecked]);

  // Toggle checklist item state
  const toggleReviewState = (itemIndex: number) => {
    if (!aiGeneratedChecklist) return;

    const updatedChecklistItems = aiGeneratedChecklist.checklistItems.map((item, index) => {
      if (index === itemIndex) {
        return { ...item, isChecked: !item.isChecked };
      }
      return item;
    });

    const updatedChecklist = {
      ...aiGeneratedChecklist,
      checklistItems: updatedChecklistItems,
    };

    // 親コンポーネントに通知
    onChecklistChange(file.filename, updatedChecklist);
  };

  // Toggle expanded state manually
  const toggleExpanded = async () => {
    const newExpanded = !expanded;

    // FileChecklistを閉じる場合の処理
    if (!newExpanded) {
      if (aiGeneratedChecklist) {
        // チェックリストがある場合：すべてのアイテムを完了済みにしてからisCloseを設定
        const updatedChecklistItems = aiGeneratedChecklist.checklistItems.map(item => ({
          ...item,
          isChecked: true,
        }));

        const updatedChecklist = {
          ...aiGeneratedChecklist,
          checklistItems: updatedChecklistItems,
          isClose: true,
        };

        // 親コンポーネントに通知（チェックリスト項目の完了 + isClose = true）
        onChecklistChange(file.filename, updatedChecklist);
      } else {
        // チェックリストが未作成の場合：isClose = trueで承認状態に
        await updateFileClose(file.filename, true);
      }
    } else {
      // FileChecklistを開く場合の処理
      if (aiGeneratedChecklist) {
        const updatedChecklist = {
          ...aiGeneratedChecklist,
          isClose: false,
        };

        // 親コンポーネントに通知（isClose = false）
        onChecklistChange(file.filename, updatedChecklist);
      } else {
        // チェックリストが未作成の場合：isClose = falseに
        await updateFileClose(file.filename, false);
      }
    }

    // expandOverrideを設定して即座にUI状態を変更
    setExpandOverride(newExpanded);
  };

  // Get status label and style based on calculated status
  const getStatusDisplay = () => {
    const currentStatus = getReviewStatus();

    switch (currentStatus) {
      case 'approved':
        return { label: t('statusApproved'), class: 'bg-green-500 text-white' };
      case 'reviewing':
        return { label: t('statusReviewing'), class: 'bg-yellow-500 text-white' };
      case 'not-reviewed':
      default:
        return { label: t('statusNotReviewed'), class: 'bg-gray-500 text-white' };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Parse the patch to create a GitHub-like diff display
  const renderGitHubStyleDiff = (patch: string) => {
    if (!patch) return null;

    const lines = patch.split('\n');
    // 行番号管理
    let oldLine = 1;
    let newLine = 1;

    // hunk headerから行番号を取得する正規表現
    const hunkHeaderRegex = /^@@\s*-(\d+),?\d*\s*\+(\d+),?\d*\s*@@/;

    return (
      <div className="text-xs border rounded overflow-hidden">
        {/* File header bar */}
        <div className="flex justify-between items-center bg-gray-100 p-2 border-b">
          <span className="font-mono font-medium">{file.filename}</span>
          <div className="flex items-center">
            <span className="text-green-600 mr-2">+{file.additions}</span>
            <span className="text-red-600">-{file.deletions}</span>
          </div>
        </div>
        {/* Diff content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-0 px-2 w-10 text-right font-mono bg-gray-50">old</th>
                <th className="py-0 px-2 w-10 text-right font-mono bg-gray-50 text-green-700">new</th>
                <th className="py-0 px-2 w-6 text-center font-mono bg-gray-50"></th>
                <th className="py-0 px-2 font-mono bg-gray-50 text-left">{t('content')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                let lineClass = '';
                let prefix = '';
                let displayOldLine = '';
                let displayNewLine = '';
                let oldLineClass = 'text-gray-400';
                let newLineClass = 'text-green-700';

                if (line.startsWith('@@')) {
                  // hunk header
                  const match = line.match(hunkHeaderRegex);
                  if (match) {
                    oldLine = parseInt(match[1], 10);
                    newLine = parseInt(match[2], 10);
                  }
                  lineClass = 'bg-blue-100';
                  prefix = '';
                  displayOldLine = '';
                  displayNewLine = '';
                  oldLineClass = '';
                  newLineClass = '';
                } else if (line.startsWith('+')) {
                  lineClass = 'bg-green-50';
                  prefix = '+';
                  displayOldLine = '';
                  displayNewLine = String(newLine);
                  oldLineClass = 'text-gray-400';
                  newLineClass = 'text-green-700 font-bold';
                  newLine++;
                } else if (line.startsWith('-')) {
                  lineClass = 'bg-red-50';
                  prefix = '-';
                  displayOldLine = String(oldLine);
                  displayNewLine = '';
                  oldLineClass = 'text-gray-400';
                  newLineClass = '';
                  oldLine++;
                } else {
                  // context line
                  prefix = ' ';
                  displayOldLine = String(oldLine);
                  displayNewLine = String(newLine);
                  oldLineClass = 'text-gray-400';
                  newLineClass = 'text-green-700';
                  oldLine++;
                  newLine++;
                }

                return (
                  <tr key={index} className={lineClass}>
                    <td className={`py-0 px-2 select-none border-r w-10 text-right font-mono ${oldLineClass}`}>
                      {displayOldLine}
                    </td>
                    <td className={`py-0 px-2 select-none border-r w-10 text-right font-mono ${newLineClass}`}>
                      {displayNewLine}
                    </td>
                    <td className="py-0 px-2 select-none text-gray-500 w-6 text-center font-mono">{prefix}</td>
                    <td className="py-0 px-2 whitespace-pre font-mono">{line.substring(prefix === '' ? 0 : 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Generate checklist for this file
  const generateChecklist = async () => {
    if (!prData || generating) return;
    try {
      // 生成中状態をセット
      setGenerating(true);
      setGlobalGenerating(true);
      setError(null);
      setExpandOverride(true); // 強制的に展開状態に

      // スクロールを生成中の要素に移動するために少し遅延
      setTimeout(() => {
        window.scrollTo({
          top: window.scrollY,
          behavior: 'smooth',
        });
      }, 100);

      const checklist = await aiService.generateChecklist(prData, file, language);
      await saveAnalysisResultChecklist(checklist);
    } catch (error) {
      setError(getLocalizedErrorMessage(error, t));
    } finally {
      setGenerating(false);
      setGlobalGenerating(false);
    }
  };

  // ローディングアニメーション制御
  useEffect(() => {
    if (generating) {
      setBlockActive(0);
      blockTimer.current = setInterval(() => {
        setBlockActive(prev => (prev + 1) % (BLOCK_TOTAL + 1));
      }, 1000); // 1秒ごとに進める
    } else {
      setBlockActive(0);
      if (blockTimer.current) clearInterval(blockTimer.current);
    }
    return () => {
      if (blockTimer.current) clearInterval(blockTimer.current);
    };
  }, [generating]);

  return (
    <>
      <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
        <div
          className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 w-full"
          role="button"
          tabIndex={0}
          onClick={toggleExpanded}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpanded();
            }
          }}>
          <div className="flex items-center max-w-[70%]">
            <span
              className={`inline-block flex-shrink-0 w-5 text-center mr-2 ${
                file.status === 'added'
                  ? 'text-green-500'
                  : file.status === 'removed'
                    ? 'text-red-500'
                    : 'text-yellow-500'
              }`}>
              {file.status === 'added' ? 'A' : file.status === 'removed' ? 'D' : 'M'}
            </span>
            <span className="font-medium text-xs break-all line-clamp-2 text-left">{file.filename}</span>
          </div>
          <div className="flex items-center flex-shrink-0 ml-2">
            <span className={`px-2 py-0.5 text-xs rounded-full mr-2 ${statusDisplay.class}`}>
              {statusDisplay.label}
            </span>
            <span className="text-gray-500">
              {expanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold mb-2">{t('aiGeneratedChecklistTitle')}</h4>
                {aiGeneratedChecklist && !isChecklistContentEmpty(aiGeneratedChecklist) && (
                  <button
                    className="px-2 py-1 bg-blue-400 hover:bg-blue-600 text-white rounded text-xs"
                    disabled={generating}
                    onClick={e => {
                      e.stopPropagation(); // 親要素へのイベント伝播を防止
                      generateChecklist();
                    }}>
                    {t('regenerate')}
                  </button>
                )}
              </div>

              {error && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-md text-xs">{error}</div>
              )}

              {generating && (
                <div className="flex flex-col items-center justify-center py-6 w-full text-gray-600">
                  <div>{t('generatingChecklist')}</div>
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
                </div>
              )}

              {!generating && (!aiGeneratedChecklist || isChecklistContentEmpty(aiGeneratedChecklist)) && (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-sm text-gray-500 mb-4">{t('aiChecklistNotGenerated')}</p>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md text-sm font-medium flex items-center shadow-sm transition-all duration-200 hover:shadow"
                    disabled={generating}
                    onClick={e => {
                      e.stopPropagation();
                      generateChecklist();
                    }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {t('generateChecklist')}
                  </button>
                </div>
              )}

              {!generating && aiGeneratedChecklist?.explanation && (
                <div className="mb-2">
                  <h4 className="text-sm font-semibold mb-2">{t('fileSummary')}</h4>
                  <p className="text-xs text-gray-500">
                    <MarkdownRenderer content={aiGeneratedChecklist?.explanation} />
                  </p>
                </div>
              )}
              <div>
                {/* チェックリストアイテムを表示 */}

                {!generating && aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0 && (
                  <ChecklistComponent
                    checklist={aiGeneratedChecklist}
                    onToggle={itemIndex => toggleReviewState(itemIndex)}
                    defaultExpanded={true}
                  />
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">{t('codeChanges')}</h4>
                {aiGeneratedChecklist && file.patch ? (
                  renderGitHubStyleDiff(file.patch)
                ) : (
                  <p className="text-sm text-gray-500 mb-4 text-center">{t('noCodeChanges')}</p>
                )}
              </div>
            </div>

            {/* AIレビューチャットボタン */}
            {aiGeneratedChecklist && (
              <div className="flex justify-center items-center mt-4">
                {onOpenChat && (
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md text-sm font-medium flex items-center shadow-sm transition-all duration-200 hover:shadow"
                    onClick={e => {
                      e.stopPropagation(); // 親要素へのイベント伝播を防止
                      onOpenChat();
                    }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    {t('openAiReviewChat')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FileChecklist;
