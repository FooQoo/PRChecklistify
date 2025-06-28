import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { PRAnalysisResult, ChecklistItemStatus, PRFile } from '@extension/shared';
import { MarkdownRenderer } from './MarkdownRenderer';

interface FileChecklistProps {
  file: PRFile;
  onChecklistChange: (filename: string, checklistItems: Record<string, ChecklistItemStatus>) => void;
  analysisResult: PRAnalysisResult | undefined;
  onOpenChat?: () => void;
  generateChecklist: () => Promise<void>;
}

// チェックリスト項目コンポーネント
interface ChecklistItemProps {
  label: string;
  status: ChecklistItemStatus;
  onToggle: () => void;
  className?: string;
}

const ChecklistItem = ({ label, status, onToggle, className = '' }: ChecklistItemProps) => {
  const getButtonStyle = (state: ChecklistItemStatus) => {
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

  const renderButtonContent = (state: ChecklistItemStatus) => {
    if (state === 'PENDING') {
      return 'PENDING';
    }
    return state;
  };

  const getButtonClasses = (state: ChecklistItemStatus) => {
    return `px-3 py-1 rounded-md text-sm font-medium transition-colors min-w-[90px] text-center ${getButtonStyle(
      state,
    )}`;
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
      <span className="text-sm">
        <MarkdownRenderer content={label} />
      </span>
    </div>
  );
};

const BLOCK_COLS = 10;
const BLOCK_ROWS = 3;
const BLOCK_TOTAL = BLOCK_COLS * BLOCK_ROWS;

export function FileChecklist({
  file,
  onChecklistChange,
  analysisResult,
  onOpenChat,
  generateChecklist,
}: FileChecklistProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockActive, setBlockActive] = useState(0);
  const blockTimer = useRef<NodeJS.Timeout | null>(null);

  const aiGeneratedChecklist = useMemo(() => {
    return analysisResult?.fileAnalysis?.find(item => item.filename === file.filename);
  }, [analysisResult, file.filename]);

  const initializeChecklistItems = useCallback(() => {
    if (aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0) {
      const items: Record<string, ChecklistItemStatus> = {};
      aiGeneratedChecklist.checklistItems.forEach((item, index) => {
        items[`item_${index}`] = item.status;
      });
      return items;
    }
    return {} as Record<string, ChecklistItemStatus>;
  }, [aiGeneratedChecklist]);

  const [checklistItems, setChecklistItems] = useState<Record<string, ChecklistItemStatus>>(initializeChecklistItems());

  useEffect(() => {
    setChecklistItems(initializeChecklistItems());
  }, [initializeChecklistItems]);

  const [expandOverride, setExpandOverride] = useState<boolean | null>(null);
  const [allItemsJustChecked, setAllItemsJustChecked] = useState(false);

  useEffect(() => {
    const initialItems = initializeChecklistItems();
    const allInitialItemsOK = Object.values(initialItems).every(item => item === 'OK');
    setAllItemsJustChecked(allInitialItemsOK);
  }, [initializeChecklistItems]);

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

  const getCalculatedExpandedState = (): boolean => {
    if (expandOverride !== null) {
      return expandOverride;
    }
    if (!checklistItems || Object.keys(checklistItems).length === 0) {
      return true;
    }
    const allOK = Object.values(checklistItems).every(item => item === 'OK');
    if (allOK && allItemsJustChecked) {
      return false;
    }
    if (getReviewStatus() === 'not-reviewed') {
      return true;
    }
    if (getReviewStatus() === 'reviewing') {
      return true;
    }
    return false;
  };

  const expanded = getCalculatedExpandedState();

  useEffect(() => {
    if (checklistItems && Object.keys(checklistItems).length > 0) {
      const allOK = Object.values(checklistItems).every(item => item === 'OK');
      if (allOK && !allItemsJustChecked) {
        setAllItemsJustChecked(true);
        setExpandOverride(null);
      } else if (!allOK) {
        setAllItemsJustChecked(false);
      }
    }
  }, [checklistItems, file.filename, allItemsJustChecked]);

  const toggleReviewState = (item: string) => {
    if (!checklistItems) return;
    const currentState = checklistItems[item];
    let nextState: ChecklistItemStatus;
    if (currentState === 'PENDING') {
      nextState = 'NG';
    } else if (currentState === 'NG') {
      nextState = 'OK';
    } else if (currentState === 'OK') {
      nextState = 'NG';
    } else {
      nextState = 'NG';
    }
    const newChecklistItems = {
      ...checklistItems,
      [item]: nextState,
    };
    setChecklistItems(newChecklistItems);
    onChecklistChange(file.filename, newChecklistItems);
  };

  const toggleExpanded = () => {
    if (expanded) {
      if (checklistItems && Object.keys(checklistItems).length > 0) {
        const allOKItems: Record<string, ChecklistItemStatus> = {};
        Object.keys(checklistItems).forEach(key => {
          allOKItems[key] = 'OK';
        });
        setChecklistItems(allOKItems);
        onChecklistChange(file.filename, allOKItems);
      }
      setExpandOverride(false);
    } else {
      setExpandOverride(true);
    }
  };

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

  const renderGitHubStyleDiff = (patch: string) => {
    if (!patch) return null;
    const lines = patch.split('\n');
    let oldLine = 1;
    let newLine = 1;
    const hunkHeaderRegex = /^@@\s*-(\d+),?\d*\s*\+(\d+),?\d*\s*@@/;
    return (
      <div className="text-xs border rounded overflow-hidden">
        <div className="flex justify-between items-center bg-gray-100 p-2 border-b">
          <span className="font-mono font-medium">{file.filename}</span>
          <div className="flex items-center">
            <span className="text-green-600 mr-2">+{file.additions}</span>
            <span className="text-red-600">-{file.deletions}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-0 px-2 w-10 text-right font-mono bg-gray-50">old</th>
                <th className="py-0 px-2 w-10 text-right font-mono bg-gray-50 text-green-700">new</th>
                <th className="py-0 px-2 w-6 text-center font-mono bg-gray-50"></th>
                <th className="py-0 px-2 font-mono bg-gray-50 text-left">内容</th>
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

  const handleGenerateClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      await generateChecklist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isGenerating) {
      setBlockActive(0);
      blockTimer.current = setInterval(() => {
        setBlockActive(prev => (prev + 1) % (BLOCK_TOTAL + 1));
      }, 1000);
    } else {
      setBlockActive(0);
      if (blockTimer.current) clearInterval(blockTimer.current);
    }
    return () => {
      if (blockTimer.current) clearInterval(blockTimer.current);
    };
  }, [isGenerating]);

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
            {aiGeneratedChecklist && (
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold mb-2">AI-Generated Checklist</h4>
                <button
                  className="px-2 py-1 bg-blue-400 hover:bg-blue-600 text-white rounded text-xs"
                  disabled={isGenerating}
                  onClick={handleGenerateClick}>
                  Regenerate
                </button>
              </div>
            )}

            {error && (
              <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-md text-xs">{error}</div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-6 w-full text-gray-600">
                <div>チェックリストを生成中...</div>
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

            {!isGenerating && !aiGeneratedChecklist && (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-sm text-gray-500 mb-4">このファイルのAIチェックリストはまだ生成されていません。</p>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md text-sm font-medium flex items-center shadow-sm transition-all duration-200 hover:shadow"
                  disabled={isGenerating}
                  onClick={handleGenerateClick}>
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

            {!isGenerating && aiGeneratedChecklist?.explanation && (
              <div className="mb-2">
                <h4 className="text-sm font-semibold mb-2">ファイルの要約</h4>
                <p className="text-xs text-gray-500">
                  <MarkdownRenderer content={aiGeneratedChecklist?.explanation} />
                </p>
              </div>
            )}
            <div>
              {!isGenerating && aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold mb-2">チェック項目</h4>
                  {aiGeneratedChecklist.checklistItems.map((item, index) => (
                    <ChecklistItem
                      key={item.id}
                      label={item.description}
                      status={checklistItems[`item_${index}`] || item.status}
                      onToggle={() => {
                        const itemKey = `item_${index}`;
                        toggleReviewState(itemKey);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isGenerating && aiGeneratedChecklist && file.patch && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Code Changes</h4>
                {renderGitHubStyleDiff(file.patch)}
              </div>
            )}

            {!isGenerating && aiGeneratedChecklist && onOpenChat && (
              <div className="flex justify-center items-center mt-4">
                <button
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md text-sm font-medium flex items-center shadow-sm transition-all duration-200 hover:shadow"
                  onClick={e => {
                    e.stopPropagation();
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
