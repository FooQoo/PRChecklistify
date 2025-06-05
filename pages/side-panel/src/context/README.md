# pages/side-panel/src/context

## Overview

This folder, named `context`, is responsible for managing the global state and navigation logic of the side panel application. It provides a centralized way to access and modify application state, as well as navigate between different views.

- **Folder Name:** `context`
- **Purpose:** Manages global state and navigation logic for the side panel application.

## Naming Conventions

-   Files related to context management should end with `Context.tsx` (e.g., `NavigationContext.tsx`).
-   Context variables and functions should use camelCase (e.g., `navigateToPr`).
-   Interface names should use PascalCase (e.g., `NavigationContextType`).
-   Atoms names should end with `Atom` (e.g., `currentPageAtom`).
-   Hook names should start with `use` and end with `Atom` (e.g., `useGithubTokenAtom`)

## Design Policy

-   The context should provide a clean and consistent API for accessing and modifying application state.
-   Navigation logic should be centralized within the context to ensure consistency and maintainability.
-   Context providers should wrap the parts of the application that need access to the context.
-   Custom hooks should be used to simplify access to context values.
-   Avoid storing large amounts of data in the context to prevent performance issues.
-   Keep context logic lean and focused on state management and navigation.
-   Side effects within the context should be handled carefully to avoid unexpected behavior.

## Technologies and Libraries Used

-   **React:**  For building the UI and using context API.
-   **`createContext` and `useContext` (from React):** For creating and consuming the navigation context.
-   **`useEffect` (from React):** For performing side effects, such as navigating based on state changes.
-   **`jotai`:** For managing global state using atoms.
-   **`@src/atoms/generatingAtom`:** For tracking the generating status.
-   **`@src/atoms/currentPageAtom`:** For tracking the current page URL.
-   **`@src/hooks/useGithubTokenAtom`:** Custom hook for accessing and managing the GitHub token.
-   **`@src/hooks/useOpenaiKeyAtom`:** Custom hook for accessing and managing the OpenAI API key.
-   **`@src/hooks/useGeminiKeyAtom`:** Custom hook for accessing and managing the Gemini API key.
-   **`@src/routes/AppRoutes`:** For handling navigation within the application.

## File Roles

| File Name           | Role                                                            | Logic and Functions                                                                                                                                                           | Names of other files used (Dependencies)                           |
| ------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `NavigationContext.tsx` | Provides the navigation context for the application.           | - `navigateToPr`: Navigates to a PR page based on a URL.\
|                           |                                                                 | - `navigateToPrFromHistory`: Navigates to a PR page from history (owner, repo, PR number).\
|                           |                                                                 | - `navigateToSettings`: Navigates to the settings page.\
|                           |                                                                 | - `navigateToHome`: Navigates to the home page.\
|                           |                                                                 | - `navigateToGithubTokenSetup`: Navigates to the GitHub token setup page.\
|                           |                                                                 | - `navigateToOpenAiTokenSetup`: Navigates to the OpenAI token setup page.\
|                           |                                                                 | - `extractPRInfo`: Extracts the owner, repository, and PR number from a PR URL. \
|                           |                                                                 | - `useEffect`: Monitors changes to `currentPage` and navigates to the PR page if necessary. \
|                           |                                                                 | - `useEffect`: Monitors changes to token and navigates to setting page if no token.                                                                                               | `AppRoutes.ts`, `generatingAtom`, `currentPageAtom`, `useGithubTokenAtom`, `useOpenaiKeyAtom`, `useGeminiKeyAtom` |

## Code Style and Examples

### Navigation

The `NavigationContext` provides functions for navigating to different parts of the application.  It uses the `router.navigate` function from `@src/routes/AppRoutes` to perform the navigation.

```typescript
const navigateToPr = (url: string) => {
  const prInfo = extractPRInfo(url);
  if (!prInfo) return;
  const { owner, repo, prNumber } = prInfo;
  router.navigate(`/pr/${owner}/${repo}/${prNumber}`);
};
```

### Context Usage

The `useNavigation` hook simplifies the usage of the `NavigationContext`. It ensures that the context is used within a `NavigationProvider`.

```typescript
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
```

### URL Extraction

The `extractPRInfo` function extracts the owner, repository, and PR number from a PR URL. This function is used to parse URLs and extract the necessary information for navigation.

```typescript
const extractPRInfo = (url: string): { owner: string; repo: string; prNumber: string } | null => {
  // githun.comに限らずドメインは考慮しない
  const baseMatch = url.match(/(?:https?:\/\/)?[^/]+\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!baseMatch) return null;

  const [, owner, repo, prNumber] = baseMatch;
  return { owner, repo, prNumber };
};
```

## File Templates and Explanations

**NavigationContext.tsx:**

```typescript
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
```

This file creates and exports a React Context named `NavigationContext`.  It provides functions to navigate the application to different routes.  It also handles initial navigation to token setup pages if tokens are missing on the first mount.

## Coding Rules Based on the Above

-   Always use the `useNavigation` hook to access the navigation context within functional components.
-   Ensure that components that use the `useNavigation` hook are wrapped within the `NavigationProvider`.
-   Centralize navigation logic within the `NavigationContext` to maintain consistency.
-   When adding new navigation functions, update the `NavigationContextType` interface and the `contextValue` object.
-   Follow the naming conventions outlined above.
-   Keep the context logic focused on state management and navigation, avoiding complex business logic.
-   Handle side effects carefully within the context, using `useEffect` appropriately.
-   When extracting information from URLs, use a dedicated function like `extractPRInfo` to encapsulate the logic.
-   Avoid redundant navigations (e.g., navigating to the same page twice in a row).

## Notes for Developers

-   When modifying the navigation logic, thoroughly test the changes to ensure that all navigation paths are working correctly.
-   Be mindful of the dependencies between files and update the import statements accordingly.
-   Document any new navigation functions or context variables clearly.
-   Consider adding unit tests to verify the behavior of the navigation functions and context provider.
-   If performance becomes an issue, investigate ways to optimize the context usage and reduce unnecessary re-renders.
-   When adding new atoms, ensure that they are properly documented and used consistently throughout the application.
