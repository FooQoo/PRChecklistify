import 'webextension-polyfill';

// Add event listener to open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async tab => {
  // Open the side panel in the current tab
  await chrome.sidePanel.open({ tabId: tab.id });
  console.log('Side panel opened for tab:', tab.id);
});

// Listen for tab updates to detect URL changes (for page reloads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tabId, 'New URL:', tab.url);
    // Store the current URL in storage for the side panel to access
    chrome.storage.local.set({
      currentPage: {
        url: tab.url,
      },
    });
  }
});

// Listen for tab activation (when user switches between tabs)
chrome.tabs.onActivated.addListener(async activeInfo => {
  // Get information about the newly activated tab
  const tab = await chrome.tabs.get(activeInfo.tabId);
  console.log('Tab activated:', activeInfo.tabId, 'URL:', tab.url);

  if (tab.url) {
    chrome.storage.local.set({
      currentPage: {
        url: tab.url,
      },
    });
  }
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
