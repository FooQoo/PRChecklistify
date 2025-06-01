import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { router } from '../routes/AppRoutes';
import { atom, useAtom } from 'jotai';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { currentPageAtom } from '@src/atoms/currentPageAtom';
import { useGithubTokenAtom } from '@src/hooks/useGithubTokenAtom';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';

// 現在のviewを管理するatom
const firstMountAtom = atom(true);

// ナビゲーション状態の型
interface NavigationContextType {
  navigateToPr: (url: string) => void;
  navigateToPrFromHistory: (owner: string, repo: string, prNumber: string) => void;
  navigateToSettings: () => void;
  navigateToHome: () => void;
  navigateToGithubTokenSetup: () => void;
  navigateToOpenAiTokenSetup: () => void;
}

// ナビゲーションコンテキストの作成
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
interface NavigationProviderProps {
  children: ReactNode;
}

// PRのURLからオーナー、リポジトリ、PR番号を抽出する関数
const extractPRInfo = (url: string): { owner: string; repo: string; prNumber: string } | null => {
  // githun.comに限らずドメインは考慮しない
  const baseMatch = url.match(/(?:https?:\/\/)?[^/]+\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!baseMatch) return null;

  console.log('baseMatch', baseMatch);

  const [, owner, repo, prNumber] = baseMatch;
  return { owner, repo, prNumber };
};

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [generating] = useAtom(generatingAtom);
  const [currentPage] = useAtom(currentPageAtom);
  const { githubToken, isGithubTokenLoaded } = useGithubTokenAtom();
  const { openaiKey, isOpenaiKeyLoaded } = useOpenaiKeyAtom();
  const { geminiKey, isGeminiKeyLoaded } = useGeminiKeyAtom();
  const [firstMount, setFirstMount] = useAtom(firstMountAtom);

  // currentPageの変更を監視してPRページに遷移する
  useEffect(() => {
    if (generating) return;

    if (currentPage?.url) {
      const prInfo = extractPRInfo(currentPage.url);
      if (prInfo) {
        router.navigate(`/pr/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
      }
    }
  }, [generating, currentPage]);

  // トークン
  useEffect(() => {
    if (firstMount && isGithubTokenLoaded && !githubToken) {
      setFirstMount(false);
      router.navigate('/github-token-setup');
      return;
    }

    if (firstMount && isOpenaiKeyLoaded && isGeminiKeyLoaded && !openaiKey && !geminiKey) {
      setFirstMount(false);
      router.navigate('/openai-token-setup');
      return;
    }
  }, [
    isGithubTokenLoaded,
    githubToken,
    firstMount,
    setFirstMount,
    isOpenaiKeyLoaded,
    openaiKey,
    isGeminiKeyLoaded,
    geminiKey,
  ]);

  // ナビゲーション関数
  const navigateToPr = (url: string) => {
    const prInfo = extractPRInfo(url);
    if (!prInfo) return;
    const { owner, repo, prNumber } = prInfo;
    router.navigate(`/pr/${owner}/${repo}/${prNumber}`);
  };

  const navigateToPrFromHistory = (owner: string, repo: string, prNumber: string) => {
    router.navigate(`/pr/${owner}/${repo}/${prNumber}`);
  };

  const navigateToSettings = () => {
    router.navigate('/settings');
  };

  const navigateToHome = () => {
    router.navigate('/');
  };

  // --- 追加: トークンセットアップ画面へのナビゲーション ---
  const navigateToGithubTokenSetup = () => {
    router.navigate('/github-token-setup');
    router.navigate('/github-token-setup');
  };

  const navigateToOpenAiTokenSetup = () => {
    router.navigate('/openai-token-setup');
  };

  // コンテキスト値の提供
  const contextValue: NavigationContextType = {
    navigateToPr,
    navigateToPrFromHistory,
    navigateToSettings,
    navigateToHome,
    navigateToGithubTokenSetup,
    navigateToOpenAiTokenSetup,
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
