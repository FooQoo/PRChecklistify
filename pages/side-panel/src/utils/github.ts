/**
 * 現在のタブがgithub.comかどうかを判定する
 */
export const isGitHubDotCom = async (): Promise<boolean> => {
  try {
    // chrome.tabs APIを使用して現在のアクティブタブの情報を取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url) {
      return false;
    }

    const url = new URL(tab.url);
    return url.hostname === 'github.com';
  } catch (error) {
    console.error('Failed to check if current site is github.com:', error);
    return false;
  }
};
