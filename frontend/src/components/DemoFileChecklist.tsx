'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { PRFile, PRAnalysisResult } from '../types';

interface DemoFileChecklistProps {
  file: PRFile;
  analysisResult: PRAnalysisResult | null;
}

interface ChecklistItemProps {
  label: string;
  status: 'PENDING' | 'OK' | 'NG';
  onToggle: () => void;
  className?: string;
}

const ChecklistItem = ({ label, status, onToggle, className = '' }: ChecklistItemProps) => {
  const getButtonStyle = (state: 'PENDING' | 'OK' | 'NG') => {
    switch (state) {
      case 'OK':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'NG':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
    }
  };

  const renderButtonContent = (state: 'PENDING' | 'OK' | 'NG') => (state === 'PENDING' ? 'PENDING' : state);

  const getButtonClasses = (state: 'PENDING' | 'OK' | 'NG') =>
    `px-3 py-1 rounded-md text-sm font-medium transition-colors min-w-[90px] text-center ${getButtonStyle(state)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button onClick={onToggle} className={getButtonClasses(status)}>
        {renderButtonContent(status)}
      </button>
      <span className="text-sm">{label}</span>
    </div>
  );
};

const DemoFileChecklist = ({ file, analysisResult }: DemoFileChecklistProps) => {
  const [expanded, setExpanded] = useState(true);

  const aiGeneratedChecklist = useMemo(() => {
    return analysisResult?.fileAnalysis?.find(item => item.filename === file.filename);
  }, [analysisResult, file.filename]);

  const initializeChecklistItems = useCallback(() => {
    if (aiGeneratedChecklist) {
      const items: Record<string, 'PENDING' | 'OK' | 'NG'> = {};
      aiGeneratedChecklist.checklistItems.forEach((item, index) => {
        items[`item_${index}`] = item.status as 'PENDING' | 'OK' | 'NG';
      });
      return items;
    }
    return {};
  }, [aiGeneratedChecklist]);

  const [checklistItems, setChecklistItems] = useState(initializeChecklistItems());

  useEffect(() => {
    setChecklistItems(initializeChecklistItems());
  }, [initializeChecklistItems]);

  const getReviewStatus = (): 'approved' | 'reviewing' | 'not-reviewed' => {
    if (Object.keys(checklistItems).length === 0) return 'not-reviewed';
    const allOK = Object.values(checklistItems).every(item => item === 'OK');
    if (allOK) return 'approved';
    const anyReviewed = Object.values(checklistItems).some(item => item !== 'PENDING');
    if (anyReviewed) return 'reviewing';
    return 'not-reviewed';
  };

  const toggleReviewState = (item: string) => {
    const currentState = checklistItems[item];
    let nextState: 'PENDING' | 'OK' | 'NG';
    if (currentState === 'PENDING') nextState = 'NG';
    else if (currentState === 'NG') nextState = 'OK';
    else nextState = 'NG';
    setChecklistItems(prev => ({ ...prev, [item]: nextState }));
  };

  const getStatusDisplay = () => {
    const currentStatus = getReviewStatus();
    switch (currentStatus) {
      case 'approved':
        return { label: '✓ Approved', class: 'bg-green-500 text-white' };
      case 'reviewing':
        return { label: '⚠ Reviewing', class: 'bg-yellow-500 text-white' };
      default:
        return { label: '⊘ Not Reviewed', class: 'bg-gray-500 text-white' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
      <button
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 w-full"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center max-w-[70%]">
          <span className="font-medium text-xs break-all line-clamp-2 text-left">{file.filename}</span>
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
          <span className={`px-2 py-0.5 text-xs rounded-full mr-2 ${statusDisplay.class}`}>{statusDisplay.label}</span>
          <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-200">
          {aiGeneratedChecklist ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-2">チェック項目</h4>
              {aiGeneratedChecklist.checklistItems.map((item, index) => (
                <ChecklistItem
                  key={item.id}
                  label={item.description}
                  status={checklistItems[`item_${index}`] || item.status}
                  onToggle={() => toggleReviewState(`item_${index}`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No checklist available for this file.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DemoFileChecklist;
