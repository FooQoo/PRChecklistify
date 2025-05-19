import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { router } from '../routes/AppRoutes';
import { extractPRInfo } from '@src/utils/prUtils';

// ナビゲーション状態の型
interface NavigationContextType {
  prKey: string | null;
  navigateToPR: (owner: string, repo: string, prNumber: string) => void;
  navigateToSettings: () => void;
  navigateToHome: () => void;
}

// ナビゲーションコンテキストの作成
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [prKey, setPrKey] = useState<string | null>(null);

  // Chrome のストレージ変更を監視
  useEffect(() => {
    const getCurrentPage = async () => {
      try {
        const result = await chrome.storage.local.get('currentPage');
        if (result.currentPage?.url) {
          // URLに基づいて適切なルートに初期ナビゲーション
          const url = result.currentPage.url;
          const prInfo = extractPRInfo(url);

          if (prInfo) {
            // もしresult.currentPage.keyがなければ、初期データにkeyを追加する
            let key = result.currentPage.key;
            if (!key) {
              key = `${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`;
              chrome.storage.local.set({
                currentPage: {
                  ...result.currentPage,
                  key,
                },
              });
            }
            setPrKey(key);
            router.navigate(`/pr/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
          } else {
            setPrKey(null);
          }
        } else {
          setPrKey(null);
        }
      } catch (error) {
        console.error('Error getting current page:', error);
        setPrKey(null);
      }
    };

    // 初期状態を取得
    getCurrentPage();

    // ストレージの変更を監視
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.currentPage) {
        const newValue = changes.currentPage.newValue;
        let key = newValue?.key;
        if (newValue?.url) {
          const prInfo = extractPRInfo(newValue.url);
          if (prInfo) {
            if (!key) {
              key = `${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`;
              const updatedPage = {
                ...newValue,
                key,
              };
              chrome.storage.local.set({ currentPage: updatedPage });
            }
            setPrKey(key);
            router.navigate(`/pr/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
          } else {
            setPrKey(null);
          }
        } else {
          setPrKey(null);
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
    const key = `${owner}/${repo}/${prNumber}`;

    // Update the router first
    router.navigate(`/pr/${owner}/${repo}/${prNumber}`);

    // Then update the storage and state
    setPrKey(key);

    // Store in Chrome storage with title for history tracking
    chrome.storage.local
      .set({
        currentPage: {
          url,
          title: `${owner}/${repo}#${prNumber}`,
          key, // "owner/repo/prNumber" 形式のキー
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
    prKey,
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
