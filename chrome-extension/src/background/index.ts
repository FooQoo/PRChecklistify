import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

// Add event listener to open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async tab => {
  // Open the side panel in the current tab
  await chrome.sidePanel.open({ tabId: tab.id });
  console.log('Side panel opened for tab:', tab.id);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
