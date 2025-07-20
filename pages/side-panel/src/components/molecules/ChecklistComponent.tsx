import { useState } from 'react';
import type { Checklist } from '../../types';
import { ChecklistItem } from '../atoms';
import { useI18n } from '@extension/i18n';

interface ChecklistComponentProps {
  checklist: Checklist;
  onToggle: (itemIndex: number) => void;
  className?: string;
  defaultExpanded?: boolean;
  onExpand?: () => void;
}

const ChecklistComponent = ({
  checklist,
  onToggle,
  className = '',
  defaultExpanded = true,
}: ChecklistComponentProps) => {
  const { t } = useI18n();
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
          {checklist.checklistItems.map((item, index) => (
            <ChecklistItem
              key={item.id || `item_${index}`}
              label={item.description}
              isChecked={item.isChecked}
              onToggle={() => onToggle(index)}
              onCopy={() => handleCopy(item.description)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistComponent;
