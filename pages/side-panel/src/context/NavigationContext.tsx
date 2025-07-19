import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { router } from '../routes/AppRoutes';
import { atom, useAtom } from 'jotai';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { currentPageAtom } from '@src/atoms/currentPageAtom';
import { useGithubTokensAtom } from '../hooks/useGithubTokensAtom';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';
import { useClaudeKeyAtom } from '@src/hooks/useClaudeKeyAtom';

// 現在のviewを管理するatom
const firstMountAtom = atom(true);

// ナビゲーション状態の型
interface NavigationContextType {
  navigateToPr: (url: string) => void;
  navigateToPrFromHistory: (domain: string, owner: string, repo: string, prNumber: string) => void;
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
const extractPRInfo = (url: string): { owner: string; repo: string; prNumber: string; domain: string } | null => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // /owner/repo/pull/123 のパターンをマッチ
    const pathMatch = urlObj.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!pathMatch) return null;

    const [, owner, repo, prNumber] = pathMatch;

    return { owner, repo, prNumber, domain };
  } catch (error) {
    console.error('Failed to parse PR URL:', error);
    return null;
  }
};

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [generating] = useAtom(generatingAtom);
  const [currentPage] = useAtom(currentPageAtom);
  const { githubTokens, isGithubTokensLoaded } = useGithubTokensAtom();
  const { openaiKey, isOpenaiKeyLoaded } = useOpenaiKeyAtom();
  const { geminiKey, isGeminiKeyLoaded } = useGeminiKeyAtom();
  const { claudeKey, isClaudeKeyLoaded } = useClaudeKeyAtom();
  const [firstMount, setFirstMount] = useAtom(firstMountAtom);

  // currentPageの変更を監視してPRページに遷移する
  useEffect(() => {
    if (generating) return;

    if (currentPage?.url) {
      const prInfo = extractPRInfo(currentPage.url);
      if (prInfo) {
        router.navigate(`/pr/${prInfo.domain}/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
      }
    }
  }, [generating, currentPage]);

  // トークン
  useEffect(() => {
    // GitHubトークンが設定されていない場合はトークンセットアップ画面に遷移
    const hasGitHubToken = githubTokens && githubTokens.tokens.length > 0;

    if (firstMount && isGithubTokensLoaded && !hasGitHubToken) {
      setFirstMount(false);
      router.navigate('/github-token-setup');
      return;
    }

    if (
      firstMount &&
      isOpenaiKeyLoaded &&
      isGeminiKeyLoaded &&
      isClaudeKeyLoaded &&
      !openaiKey &&
      !geminiKey &&
      !claudeKey
    ) {
      setFirstMount(false);
      router.navigate('/openai-token-setup');
      return;
    }
  }, [
    isGithubTokensLoaded,
    githubTokens,
    firstMount,
    setFirstMount,
    isOpenaiKeyLoaded,
    openaiKey,
    isGeminiKeyLoaded,
    geminiKey,
    isClaudeKeyLoaded,
    claudeKey,
  ]);

  // ナビゲーション関数
  const navigateToPr = (url: string) => {
    const prInfo = extractPRInfo(url);
    if (!prInfo) return;
    const { domain, owner, repo, prNumber } = prInfo;
    router.navigate(`/pr/${domain}/${owner}/${repo}/${prNumber}`);
  };

  const navigateToPrFromHistory = (domain: string, owner: string, repo: string, prNumber: string) => {
    router.navigate(`/pr/${domain}/${owner}/${repo}/${prNumber}`);
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
