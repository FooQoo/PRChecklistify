import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

// Function to check if URL is a GitHub PR details page
const isGitHubPRPage = (url: string): boolean => {
  return !!url && /^https:\/\/github\.com\/.*\/pull\/\d+/.test(url);
};

// Add event listener to open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async tab => {
  // Open the side panel in the current tab
  await chrome.sidePanel.open({ tabId: tab.id });
  console.log('Side panel opened for tab:', tab.id);
});

// Listen for tab updates to detect URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isPRPage = isGitHubPRPage(tab.url);
    // Store the current page type in storage for the side panel to access
    chrome.storage.local.set({
      currentPage: {
        isPRPage,
        url: tab.url,
      },
    });
  }
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
