import { useEffect, useState } from 'react';
import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { currentPageAtom } from './hooks/usePRData';
import { useAtom } from 'jotai';
import AppRouter from './routes/AppRoutes';

// Define the CurrentPage type for clarity
type CurrentPage = {
  url: string;
};

const SidePanel = () => {
  const [, setCurrentPage] = useState<CurrentPage | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up the atom for current page to be used by the hook
  const [, setCurrentPageAtom] = useAtom(currentPageAtom);

  useEffect(() => {
    // Function to get current page information from storage
    const getCurrentPage = async () => {
      setLoading(true);
      try {
        const result = await chrome.storage.local.get('currentPage');
        const page = result.currentPage || { isPRPage: false, url: '' };
        setCurrentPage(page);
        // Update the atom so our hook can use it
        if (page && page.url) {
          setCurrentPageAtom({ url: page.url });
        }
      } catch (error) {
        console.error('Error getting current page:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get initial state
    getCurrentPage();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      console.log('Storage changes:', changes);
      if (changes.currentPage) {
        const newPage = changes.currentPage.newValue;
        setCurrentPage(newPage);
        // Update the atom so our hook can use it
        if (newPage && newPage.url) {
          setCurrentPageAtom({ url: newPage.url });
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [setCurrentPageAtom]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="main-container">
      <AppRouter />
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
