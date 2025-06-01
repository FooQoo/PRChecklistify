import { useState, useCallback, useEffect, useMemo } from 'react';
import type { PRData, Checklist, PRAnalysisResult } from '../types';
import { useSetAtom } from 'jotai';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { fetchers } from '@src/services/aiService';
import type { Language } from '@extension/storage';

interface FileChecklistProps {
  file: PRData['files'][0];
  onChecklistChange: (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => void;
  analysisResult: PRAnalysisResult | undefined;
  onOpenChat?: () => void;
  prData: PRData;
  language: Language;
  saveAnalysisResultChecklist: (fileChecklist: Checklist) => Promise<void>;
}

// チェックリスト項目コンポーネント
interface ChecklistItemProps {
  label: string;
  status: 'PENDING' | 'OK' | 'NG';
  onToggle: () => void;
  className?: string;
}

const ChecklistItem = ({ label, status, onToggle, className = '' }: ChecklistItemProps) => {
  // Get the appropriate button style based on current state
  const getButtonStyle = (state: 'PENDING' | 'OK' | 'NG') => {
    switch (state) {
      case 'OK':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'NG':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'PENDING':
      default:
        return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
    }
  };

  // Render the button content
  const renderButtonContent = (state: 'PENDING' | 'OK' | 'NG') => {
    if (state === 'PENDING') {
      return 'PENDING';
    }
    return state;
  };

  // Get button class with fixed width
  const getButtonClasses = (state: 'PENDING' | 'OK' | 'NG') => {
    return `px-3 py-1 rounded-md text-sm font-medium transition-colors min-w-[90px] text-center ${getButtonStyle(state)}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={e => {
          e.stopPropagation(); // Prevent event propagation to parent elements
          onToggle();
        }}
        className={getButtonClasses(status)}>
        {renderButtonContent(status)}
      </button>
      <label className="text-sm">{label}</label>
    </div>
  );
};

const FileChecklist = ({
  file,
  onChecklistChange,
  analysisResult,
  onOpenChat,
  prData,
  language,
  saveAnalysisResultChecklist,
}: FileChecklistProps) => {
  const [generating, setGenerating] = useState(false);
  const setGlobalGenerating = useSetAtom(generatingAtom);
  const [error, setError] = useState<string | null>(null);

  const aiGeneratedChecklist = useMemo(() => {
    return analysisResult?.fileAnalysis.find(item => item.filename === file.filename);
  }, [analysisResult, file.filename]);

  // AI生成されたチェックリストに基づいて動的オブジェクトを準備
  const initializeChecklistItems = useCallback(() => {
    // AIによって生成されたチェックリストが利用可能な場合、そのアイテムを含むオブジェクトを作成
    if (aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0) {
      const items: Record<string, 'PENDING' | 'OK' | 'NG'> = {};
      aiGeneratedChecklist.checklistItems.forEach((item, index) => {
        // AIチェックリストのステータスを初期値として使用
        items[`item_${index}`] = ['PENDING', 'OK', 'NG'].includes(item.status)
          ? (item.status as 'PENDING' | 'OK' | 'NG')
          : 'PENDING';
      });
      return items;
    }

    // AI生成チェックリストがない場合はプレースホルダーとして1つの'OK'ステータスのアイテムを作成
    return {} as Record<string, 'PENDING' | 'OK' | 'NG'>;
  }, [aiGeneratedChecklist]);

  // State to track checklist items - Initialize from saved data if available
  const [checklistItems, setChecklistItems] =
    useState<Record<string, 'PENDING' | 'OK' | 'NG'>>(initializeChecklistItems());

  // aiGeneratedChecklistが変更されたときだけ状態を更新
  useEffect(() => {
    // 明示的にaiGeneratedChecklistが変更されたときだけchecklistItemsを初期化
    setChecklistItems(initializeChecklistItems());
  }, [initializeChecklistItems]);

  // Override to force expanded state (when user clicks to manually open/close)
  const [expandOverride, setExpandOverride] = useState<boolean | null>(null);
  // Track if all items were just checked to trigger auto-collapse
  const [allItemsJustChecked, setAllItemsJustChecked] = useState(false);

  // Initialize the allItemsJustChecked state based on initial checklist items
  useEffect(() => {
    const initialItems = initializeChecklistItems();
    const allInitialItemsOK = Object.values(initialItems).every(item => item === 'OK');
    setAllItemsJustChecked(allInitialItemsOK);
  }, [initializeChecklistItems]);

  // Calculate review status directly from checklist items
  const getReviewStatus = (): 'approved' | 'reviewing' | 'not-reviewed' => {
    if (!checklistItems || Object.keys(checklistItems).length === 0) {
      return 'not-reviewed';
    }

    const allOK = Object.values(checklistItems).every(item => item === 'OK');
    const anyReviewed = Object.values(checklistItems).some(item => item !== 'PENDING');

    if (allOK) {
      return 'approved';
    } else if (anyReviewed) {
      return 'reviewing';
    } else {
      return 'not-reviewed';
    }
  };

  // Calculate if expanded based on checklist state
  const getCalculatedExpandedState = (): boolean => {
    // If user has explicitly set expand state via override, use that
    if (expandOverride !== null) {
      return expandOverride;
    }

    // If there are no checklist items yet, keep expanded
    if (!checklistItems || Object.keys(checklistItems).length === 0) {
      return true;
    }

    const allOK = Object.values(checklistItems).every(item => item === 'OK');

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

  // 親コンポーネントへの通知を最適化するため、ローカル状態変更時のみ通知する
  // これによって無限ループを防止
  useEffect(() => {
    // checklistItemsがローカルで変更されたときだけ実行
    if (checklistItems && Object.keys(checklistItems).length > 0) {
      // 不要な更新を避けるため、必要なときだけ親コンポーネントに通知
      console.log(`Updating checklist for file: ${file.filename}`, checklistItems);

      // Check if all items just became OK
      const allOK = Object.values(checklistItems).every(item => item === 'OK');
      if (allOK && !allItemsJustChecked) {
        setAllItemsJustChecked(true);
        // Reset the override when items are all OK
        setExpandOverride(null);
      } else if (!allOK) {
        setAllItemsJustChecked(false);
      }
    }
  }, [checklistItems, file.filename, allItemsJustChecked]);

  // Toggle through the review states: PENDING -> NG -> OK -> NG
  const toggleReviewState = (item: string) => {
    console.log(`Toggling review state for '${item}' in file: ${file.filename}`);

    if (!checklistItems) return;

    const currentState = checklistItems[item];
    let nextState: 'PENDING' | 'OK' | 'NG';

    // PENDING -> NG -> OK -> NG cycle
    if (currentState === 'PENDING') {
      nextState = 'NG';
    } else if (currentState === 'NG') {
      nextState = 'OK';
    } else if (currentState === 'OK') {
      nextState = 'NG';
    } else {
      nextState = 'NG'; // fallback case, though it shouldn't happen
    }

    const newChecklistItems = {
      ...checklistItems,
      [item]: nextState,
    };

    // ローカル状態を更新
    setChecklistItems(newChecklistItems);

    // 明示的に親コンポーネントに通知（useEffectとは別に）
    onChecklistChange(file.filename, newChecklistItems);
  };

  // Toggle expanded state manually
  const toggleExpanded = () => {
    // タブを閉じる操作の場合
    if (expanded) {
      // If we have checklist items, set them all to OK
      if (checklistItems && Object.keys(checklistItems).length > 0) {
        const allOKItems: Record<string, 'PENDING' | 'OK' | 'NG'> = {};

        // Set all items to OK
        Object.keys(checklistItems).forEach(key => {
          allOKItems[key] = 'OK';
        });

        // チェックリストを全てOKに変更
        setChecklistItems(allOKItems);

        // 親コンポーネントに変更を通知
        onChecklistChange(file.filename, allOKItems);
      }

      // 閉じる
      setExpandOverride(false);
    } else {
      // タブを開く操作の場合は通常通り開くだけ
      setExpandOverride(true);
    }
  };

  // Get status label and style based on calculated status
  const getStatusDisplay = () => {
    const currentStatus = getReviewStatus();

    switch (currentStatus) {
      case 'approved':
        return { label: '✓ Approved', class: 'bg-green-500 text-white' };
      case 'reviewing':
        return { label: '⚠ Reviewing', class: 'bg-yellow-500 text-white' };
      case 'not-reviewed':
      default:
        return { label: '⊘ Not Reviewed', class: 'bg-gray-500 text-white' };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Parse the patch to create a GitHub-like diff display
  const renderGitHubStyleDiff = (patch: string) => {
    if (!patch) return null;

    // Split the patch into lines
    const lines = patch.split('\n');

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
            <tbody>
              {lines.map((line, index) => {
                // Determine line type
                let lineClass = '';
                let prefix = '';

                if (line.startsWith('+')) {
                  lineClass = 'bg-green-50';
                  prefix = '+';
                } else if (line.startsWith('-')) {
                  lineClass = 'bg-red-50';
                  prefix = '-';
                } else if (line.startsWith('@')) {
                  lineClass = 'bg-blue-100';
                  prefix = '';
                } else {
                  prefix = ' ';
                }

                return (
                  <tr key={index} className={lineClass}>
                    <td className="py-0 px-2 select-none text-gray-500 border-r w-12 text-right">{index + 1}</td>
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

      // ファイルごとのチェックリスト生成
      console.log(`Generating checklist for file: ${file.filename}`);
      const checklist = await fetchers.generateChecklist(prData, file, language);
      await saveAnalysisResultChecklist(checklist);
    } catch (error) {
      setError('チェックリスト生成中にエラーが発生しました。');
      console.error('Checklist generation error:', error);
    } finally {
      setGenerating(false);
      setGlobalGenerating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
      <button
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 w-full"
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
          <span className={`px-2 py-0.5 text-xs rounded-full mr-2 ${statusDisplay.class}`}>{statusDisplay.label}</span>
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
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold mb-2">AI-Generated Checklist</h4>
              {aiGeneratedChecklist && (
                <button
                  className="px-2 py-1 bg-blue-400 hover:bg-blue-600 text-white rounded text-xs"
                  disabled={generating}
                  onClick={e => {
                    e.stopPropagation(); // 親要素へのイベント伝播を防止
                    generateChecklist();
                  }}>
                  再生成
                </button>
              )}
            </div>

            {error && (
              <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-md text-xs">{error}</div>
            )}

            {generating && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-sm text-gray-600">チェックリストを生成中...</span>
              </div>
            )}

            {!generating && !aiGeneratedChecklist && (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-sm text-gray-500 mb-4">このファイルのAIチェックリストはまだ生成されていません。</p>
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
                  チェックリストを生成
                </button>
              </div>
            )}

            {!generating && aiGeneratedChecklist?.explanation && (
              <div className="mb-2">
                <h4 className="text-sm font-semibold mb-2">ファイルの要約</h4>
                <p className="text-xs text-gray-500">{aiGeneratedChecklist?.explanation}</p>
              </div>
            )}
            <div>
              {/* チェックリストアイテムを表示 */}

              {!generating && aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold mb-2">チェック項目</h4>
                  {aiGeneratedChecklist.checklistItems.map((item, index) => (
                    <ChecklistItem
                      key={item.id}
                      label={item.description}
                      status={checklistItems[`item_${index}`] || item.status}
                      onToggle={() => {
                        // Toggle the status in a circular manner: PENDING -> NG -> OK -> NG
                        const itemKey = `item_${index}`;
                        toggleReviewState(itemKey);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {!generating && aiGeneratedChecklist && file.patch && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Code Changes</h4>
                {renderGitHubStyleDiff(file.patch)}
              </div>
            )}

            {/* AIレビューチャットボタン */}
            {!generating && aiGeneratedChecklist && (
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
                    AIレビュー チャットを開く
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileChecklist;
