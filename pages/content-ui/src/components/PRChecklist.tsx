import type React from 'react';
import { useEffect, useState } from 'react';
import type { PRChecklistItem } from '@extension/storage';
import { prChecklistStorage } from '@extension/storage';
import type { GitHubPRInfo } from '@extension/shared';
import { GitHubUtils } from '@extension/shared';
import useTranslation from '@extension/i18n';

// Generate a custom ID for checklist items using text content and timestamp
const generateCustomItemId = (text: string): string => {
  const timestamp = Date.now();
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 20);
  return `${normalizedText}-${timestamp}`;
};

export const PRChecklist: React.FC = () => {
  const t = useTranslation();
  const [prInfo, setPRInfo] = useState<GitHubPRInfo | null>(null);
  const [items, setItems] = useState<PRChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load PR info and checklist data when component mounts
  useEffect(() => {
    const loadPRInfo = async () => {
      setIsLoading(true);
      const currentPRInfo = GitHubUtils.getCurrentPRInfo();

      if (currentPRInfo) {
        setPRInfo(currentPRInfo);

        // Try to load existing checklist for this PR
        try {
          const prData = await prChecklistStorage.getPR(currentPRInfo.uniqueId);

          if (prData) {
            setItems(prData.items);
          } else {
            // Create a new PR entry with empty checklist
            await prChecklistStorage.addPR({
              uniqueId: currentPRInfo.uniqueId,
              repositoryName: `${currentPRInfo.owner}/${currentPRInfo.repo}`,
              items: [],
            });
          }
        } catch (error) {
          console.error('Error loading PR checklist:', error);
        }
      }

      setIsLoading(false);
    };

    loadPRInfo();
  }, []);

  // Save checklist items whenever they change
  useEffect(() => {
    const savePRItems = async () => {
      if (prInfo && items) {
        try {
          await prChecklistStorage.updatePRItems(prInfo.uniqueId, items);
        } catch (error) {
          console.error('Error saving PR checklist items:', error);
        }
      }
    };

    if (!isLoading) {
      savePRItems();
    }
  }, [items, prInfo, isLoading]);

  // Add a new checklist item
  const handleAddItem = () => {
    if (newItemText.trim() === '') return;

    const newItem: PRChecklistItem = {
      id: generateCustomItemId(newItemText),
      text: newItemText,
      completed: false,
    };

    setItems([...items, newItem]);
    setNewItemText('');
  };

  // Handle toggle item completion status
  const handleToggleItem = async (itemId: string) => {
    if (!prInfo) return;

    try {
      await prChecklistStorage.toggleItemStatus(prInfo.uniqueId, itemId);
      setItems(items.map(item => (item.id === itemId ? { ...item, completed: !item.completed } : item)));
    } catch (error) {
      console.error('Error toggling item status:', error);
    }
  };

  // Delete a checklist item
  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // If not on a PR page, don't render anything
  if (!prInfo) {
    return null;
  }

  return (
    <div className="pr-checklist-container p-4 bg-white dark:bg-gray-800 rounded-md shadow-md">
      <h2 className="text-xl font-bold mb-4">{t('prChecklist')}</h2>

      {isLoading ? (
        <div className="flex justify-center">{t('loading')}</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex">
              <input
                type="text"
                className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none"
                placeholder={t('addChecklistItem')}
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddItem()}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                onClick={handleAddItem}>
                +
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">{t('noChecklistItems')}</div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleItem(item.id)}
                      className="mr-2 h-5 w-5"
                    />
                    <span className={item.completed ? 'line-through text-gray-500' : ''}>{item.text}</span>
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {prInfo && <div className="mt-4 text-xs text-gray-500">PR: {prInfo.uniqueId}</div>}
    </div>
  );
};
