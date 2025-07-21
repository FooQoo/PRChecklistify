import { useState, useEffect } from 'react';
import { useAtom, atom } from 'jotai';

export interface CurrentPage {
  url: string;
}

// Create and export the atom within this hook module
export const currentPageAtom = atom<CurrentPage | null>(null);

export const useCurrentPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPageAtom] = useAtom(currentPageAtom);

  const getCurrentPageFromTabs = async (): Promise<CurrentPage | null> => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab?.url) {
        return { url: tab.url };
      }
      return null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial load
    const loadCurrentPage = async () => {
      setLoading(true);
      const page = await getCurrentPageFromTabs();
      setCurrentPageAtom(page);
      setLoading(false);
    };

    loadCurrentPage();

    // Listen for tab updates
    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === 'complete' && tab.active && tab.url) {
        setCurrentPageAtom({ url: tab.url });
      }
    };

    // Listen for tab activation (switching between tabs)
    const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab?.url) {
        setCurrentPageAtom({ url: tab.url });
      }
    };

    // Add listeners
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Cleanup listeners
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, [setCurrentPageAtom]);

  return { currentPage, loading };
};
