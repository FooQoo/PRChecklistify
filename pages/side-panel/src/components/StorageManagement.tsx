import { useEffect, useState } from 'react';

// Component for storage management (clear PR data)
const StorageManagement = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [prDataCount, setPRDataCount] = useState<number | null>(null);

  // Get count of saved PR data
  useEffect(() => {
    const countPRData = async () => {
      try {
        // Get all keys from storage
        const items = await chrome.storage.local.get(null);

        // Count only PR data (keys that don't end with "_analysis")
        const prDataKeys = Object.keys(items).filter(
          key =>
            // Match standard PR IDs (owner/repo/number) but not analysis keys
            /^[^/]+\/[^/]+\/\d+$/.test(key) && !key.endsWith('_analysis'),
        );

        setPRDataCount(prDataKeys.length);
      } catch (error) {
        console.error('Error counting PR data:', error);
      }
    };

    countPRData();
  }, []);

  // Clear all PR data from storage
  const handleClearAllPRData = async () => {
    if (!window.confirm('Are you sure you want to delete all saved PR data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      setMessage({ text: '', type: '' });

      // Get the 'pr' object from storage
      const result = await chrome.storage.local.get('pr');
      const prStorage = result.pr || {};

      if (Object.keys(prStorage).length === 0) {
        setMessage({ text: 'No PR data found to clear', type: 'info' });
        setIsClearing(false);
        return;
      }

      // Clear the entire 'pr' object
      await chrome.storage.local.remove('pr');

      setMessage({ text: `Successfully cleared ${Object.keys(prStorage).length} PR data items`, type: 'success' });
      setPRDataCount(0);
    } catch (error) {
      console.error('Error clearing PR data:', error);
      setMessage({ text: 'Failed to clear PR data', type: 'error' });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded p-4 w-full mt-4">
      <h3 className="text-lg font-bold mb-3">Storage Management</h3>

      <div className="mb-4">
        <p className="text-sm mb-2">
          {prDataCount === null
            ? 'Counting saved PR data...'
            : prDataCount === 0
              ? 'No PR data currently saved in storage.'
              : `You have ${prDataCount} PR(s) saved in storage.`}
        </p>

        <div className="mt-4">
          <button
            onClick={handleClearAllPRData}
            disabled={isClearing || prDataCount === 0}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            {isClearing ? 'Clearing...' : 'Clear All PR Data'}
          </button>

          <p className="text-xs text-gray-600 mt-2">
            This will delete all saved PR data, including checklist statuses and AI analysis results.
          </p>
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
