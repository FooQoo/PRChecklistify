import { useEffect, useState } from 'react';
import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useAtom } from 'jotai';
import AppRouter from './routes/AppRoutes';
import { currentPageAtom } from './atoms/currentPageAtom';
import { useI18n } from '@extension/i18n';

const SidePanel = () => {
  // Initialize i18n
  useI18n();

  const [loading, setLoading] = useState(true);

  // Set up the atom for current page to be used by the hook
  const [, setCurrentPageAtom] = useAtom(currentPageAtom);

  useEffect(() => {
    // Function to get current page information from storage
    const getCurrentPage = async () => {
      setLoading(true);
      try {
        const result = await chrome.storage.local.get('currentPage');
        const page = result.currentPage || { url: '' };

        // Update the atom so our hook can use it
        setCurrentPageAtom({ url: page.url });
      } catch (error) {
        console.error('Error getting current page:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for storage changes to update the current page
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.currentPage) {
        const newPage = changes.currentPage.newValue;

        if (newPage) {
          // Update the atom so our hook can use it
          setCurrentPageAtom({ url: newPage.url });
        }
      }
    };

    // Initial fetch
    getCurrentPage();

    // Add storage listener
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Clean up listener
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [setCurrentPageAtom]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AppRouter />;
};

export default withErrorBoundary(withSuspense(SidePanel, <div>Loading...</div>), <div>Error!</div>);
