import type React from 'react';
import { useState } from 'react';
import type { Checklist } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { t } from '@extension/i18n';

interface ChecklistComponentProps {
  checklist: Checklist;
  checklistItems: Record<string, boolean>;
  onToggle: (itemKey: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

// チェックリスト項目コンポーネント
interface ChecklistItemProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
  onCopy?: () => Promise<boolean>;
  className?: string;
}

const ChecklistItem = ({ label, isChecked, onToggle, onCopy, className = '' }: ChecklistItemProps) => {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleCopyClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onCopy) {
      const success = await onCopy();
      if (success) {
        setTooltip('copy');
        setTimeout(() => setTooltip(null), 1500);
      }
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="w-4 h-4 min-w-4 min-h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      <span className="text-sm">
        <MarkdownRenderer content={label} />
      </span>
      {onCopy && (
        <div className="relative ml-auto flex items-center gap-1">
          {tooltip && (
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 py-px rounded shadow pointer-events-none">
              {tooltip}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyClick}
            className="text-gray-600 focus:outline-none shadow-none hover:shadow-none focus:shadow-none"
            aria-label={t('copy')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 transition-transform duration-150 hover:scale-110 hover:drop-shadow-md hover:text-gray-800"
              viewBox="0 0 20 20"
              fill="currentColor">
              <rect x="7" y="7" width="9" height="9" rx="2" className="fill-gray-300" />
              <rect x="4" y="4" width="9" height="9" rx="2" className="fill-white stroke-gray-500" strokeWidth="1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const ChecklistComponent = ({
  checklist,
  checklistItems,
  onToggle,
  className = '',
  defaultExpanded = true,
}: ChecklistComponentProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleCopy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}>
        <div className="flex items-center justify-between w-full">
          <h4 className="text-sm font-semibold mb-0 flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('checklistItemsTitle')}
          </h4>
          {!expanded && <span className="text-xs text-gray-400 mr-6">{t('clickToExpand')}</span>}
        </div>
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
      {expanded && (
        <div className="space-y-2">
          {checklist.checklistItems.map((item, index) => {
            const itemKey = `item_${index}`;
            const checked = checklistItems[itemKey] ?? item.isChecked;

            return (
              <ChecklistItem
                key={item.id || itemKey}
                label={item.description}
                isChecked={checked}
                onToggle={() => onToggle(itemKey)}
                onCopy={() => handleCopy(item.description)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChecklistComponent;
