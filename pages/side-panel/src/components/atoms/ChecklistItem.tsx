import type React from 'react';
import { useState } from 'react';
import { MarkdownRenderer } from '../molecules/MarkdownRenderer';
import { useI18n } from '@extension/i18n';

interface ChecklistItemProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
  onCopy?: () => Promise<boolean>;
  className?: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, isChecked, onToggle, onCopy, className = '' }) => {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { t } = useI18n();

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

export default ChecklistItem;
