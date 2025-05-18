import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { router } from '../routes/AppRoutes';

// ナビゲーション状態の型
interface NavigationContextType {
  currentURL: string | null;
  navigateToPR: (owner: string, repo: string, prNumber: string) => void;
  navigateToSettings: () => void;
  navigateToHome: () => void;
}

// ナビゲーションコンテキストの作成
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// URL からプルリクエスト情報を抽出する関数
const extractPRInfoFromURL = (url: string) => {
  const match = url.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;

  const [, owner, repo, prNumber] = match;
  return { owner, repo, prNumber };
};

// コンテキストプロバイダーコンポーネント
interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentURL, setCurrentURL] = useState<string | null>(null);

  // Chrome のストレージ変更を監視
  useEffect(() => {
    const getCurrentPage = async () => {
      try {
        const result = await chrome.storage.local.get('currentPage');
        if (result.currentPage?.url) {
          setCurrentURL(result.currentPage.url);

          // URLに基づいて適切なルートに初期ナビゲーション
          const url = result.currentPage.url;
          const prInfo = extractPRInfoFromURL(url);

          if (prInfo) {
            // もしresult.currentPage.keyがなければ、初期データにkeyを追加する
            if (!result.currentPage.key) {
              const prKey = `${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`;
              chrome.storage.local.set({
                currentPage: {
                  ...result.currentPage,
                  key: prKey,
                },
              });
            }
            router.navigate(`/pr/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
          }
        }
      } catch (error) {
        console.error('Error getting current page:', error);
      }
    };

    // 初期状態を取得
    getCurrentPage();

    // ストレージの変更を監視
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.currentPage) {
        const newURL = changes.currentPage.newValue?.url;
        setCurrentURL(newURL);

        // URL変更時にルーターのナビゲーションも更新
        if (newURL) {
          const prInfo = extractPRInfoFromURL(newURL);
          if (prInfo) {
            // newValueにkeyがなければ追加する
            if (!changes.currentPage.newValue?.key) {
              const prKey = `${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`;
              const updatedPage = {
                ...changes.currentPage.newValue,
                key: prKey,
              };

              chrome.storage.local.set({ currentPage: updatedPage });
            }
            router.navigate(`/pr/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
          }
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // ナビゲーション関数
  const navigateToPR = (owner: string, repo: string, prNumber: string) => {
    const url = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
    const prKey = `${owner}/${repo}/${prNumber}`;

    // Update the router first
    router.navigate(`/pr/${owner}/${repo}/${prNumber}`);

    // Then update the storage and state
    setCurrentURL(url);

    // Store in Chrome storage with title for history tracking
    chrome.storage.local
      .set({
        currentPage: {
          url,
          title: `${owner}/${repo}#${prNumber}`,
          key: prKey, // "owner/repo/prNumber" 形式のキー
          isPRPage: true,
        },
      })
      .catch(error => {
        console.error('Error setting current page:', error);
      });
  };

  const navigateToSettings = () => {
    router.navigate('/settings');
  };

  const navigateToHome = () => {
    router.navigate('/');
  };

  // コンテキスト値の提供
  const contextValue: NavigationContextType = {
    currentURL,
    navigateToPR,
    navigateToSettings,
    navigateToHome,
  };

  return <NavigationContext.Provider value={contextValue}>{children}</NavigationContext.Provider>;
};

// カスタムフック - コンテキストの使用を簡素化
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
