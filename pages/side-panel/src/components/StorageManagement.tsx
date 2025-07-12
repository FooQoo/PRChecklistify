import { useEffect, useState } from 'react';
import { useI18n } from '@extension/i18n';

// Component for storage management (clear PR data)
const StorageManagement = () => {
  const { t } = useI18n();
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [hasPrData, setHasPRData] = useState(false);

  // Get count of saved PR data
  useEffect(() => {
    const countPRData = async () => {
      try {
        // Get all keys from storage
        const items = await chrome.storage.local.get(null);

        // Count only PR data (keys that don't end with "_analysis")
        const prDataKeys = Object.keys(items);

        setHasPRData(prDataKeys.length > 0);
      } catch (error) {
        console.error('Error counting PR data:', error);
      }
    };

    countPRData();
  }, []);

  // Clear all PR data from storage
  const handleClearAllPRData = async () => {
    if (!window.confirm(t('deletePrDataConfirm'))) {
      return;
    }

    try {
      setIsClearing(true);
      setMessage({ text: '', type: '' });

      // Get the 'pr' object from storage
      const result = await chrome.storage.local.get('pr_data_cache');
      const prStorage = result.pr || {};

      if (Object.keys(prStorage).length === 0) {
        setMessage({ text: t('noPrDataFound'), type: 'info' });
        setIsClearing(false);
        return;
      }

      // Clear the entire 'pr' object
      await chrome.storage.local.remove('pr_data_cache');

      setMessage({ text: t('prDataCleared'), type: 'success' });
      setHasPRData(false);
    } catch (error) {
      console.error('Error clearing PR data:', error);
      setMessage({ text: t('failedToClearPrData'), type: 'error' });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded p-4 w-full mt-4">
      <h3 className="text-lg font-bold mb-3">{t('storageManagement')}</h3>

      <div className="mb-4">
        <p className="text-sm mb-2">{hasPrData ? t('noPrDataSaved') : t('prDataSaved')}</p>

        <div className="mt-4">
          <button
            onClick={handleClearAllPRData}
            disabled={isClearing || !hasPrData}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            {isClearing ? t('clearing') : t('clearAllPrData')}
          </button>

          <p className="text-xs text-gray-600 mt-2">{t('deletePrDataNotice')}</p>
        </div>

        {message.text && (
          <p
            className={`text-xs mt-2 ${
              message.type === 'success'
                ? 'text-green-500'
                : message.type === 'error'
                  ? 'text-red-500'
                  : 'text-blue-500'
            }`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default StorageManagement;
