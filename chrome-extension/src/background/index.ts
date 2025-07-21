import 'webextension-polyfill';

// Add event listener to open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async tab => {
  // Open the side panel in the current tab
  await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
});

// Note: currentPage is now handled directly by the side panel via chrome.tabs.query
// No need for background script to track tab changes for currentPage
