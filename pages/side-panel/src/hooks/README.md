# pages/side-panel/src/hooks

## Overview

### Folder name
hooks

### Purpose of the folder
This folder contains custom React hooks used within the side panel component of the application. These hooks are responsible for managing state, interacting with storage, and fetching data related to Pull Requests (PRs) and AI service API keys, model client type and domains. They encapsulate complex logic, making the components that use them cleaner and more maintainable.

## Naming Conventions

- Hooks should be named starting with `use` followed by a descriptive name of what the hook does, e.g., `usePRData`, `useGithubTokenAtom`.
- Atoms defined for use with Jotai should be named with the noun they represent followed by `Atom`, e.g. `githubTokenAtom`.
- Setter and remover functions for atom values should use `set[Noun]AndStorage` and `clear[Noun]`, respectively, to denote they also interact with persistent storage.

## Design Policy

- **Separation of Concerns:** Each hook should have a clear and focused responsibility.
- **Reusability:** Hooks should be designed to be reusable across different components within the side panel.
- **State Management:** Hooks that manage state should use Jotai atoms for global state and `useState` for component-specific state.
- **Asynchronous Operations:** Hooks that perform asynchronous operations should handle loading states and errors.
- **Storage Interaction:** Hooks dealing with persistent data should abstract the storage interaction logic.
- **Atom Pattern:** Use Jotai atoms and custom hooks to manage global states.
  - Define atom with `atom` from `jotai`.
  - Create hook prefixed with `use` to access the atom. The hook should also manage synchronization with `localStorage`.
- **Side Effects:** When loading data from persistent storage to Jotai atoms, handle the case when component unmounts to avoid memory leaks by using a `mounted` flag in the `useEffect`.

## Technologies and Libraries Used

- **React:** Used for building the UI and managing component lifecycle.
- **Jotai:** Used for state management.
- **`@extension/storage`:** Used to interact with browser extension storage for persistent data.
- **`@src/utils/*`:** Used for utility functions
- **`@src/atoms/*`:** Used for Jotai atoms that manage application-wide state.
- **`../services/*`:** Used for interaction with backend and services.

## File Roles

| File Name                      | Role                                                                                                | Logic and Functions                                                                                                                                                                                                                                   | Names of other files used (Dependencies)                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prDataLoader.ts`              | Loads and refreshes PR data from various sources (storage or API).                                   | - `loadPRDataFromAnySource`: Tries to load PR data from storage, if not found, fetches from API and saves to storage. Handles errors.<br>- `fetchAndSetPRData`: Fetches PR data from API, saves to storage, and updates state. Handles errors. | - `../types`: For type definitions of `PRData` and `PRAnalysisResult`.<br>- `../services/prDataService`: For fetching and saving PR data.<br>- `@src/utils/prUtils`: For extracting PR info. |
| `useGeminiKeyAtom.ts`           | Manages the Gemini API key using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the Gemini API key stored in browser extension storage. Provides methods to set and clear the key.                                                                                                         | - `jotai`<br>- `react`<br>- `../services/gemini`                                                                                                                                           |
| `useGithubApiDomainAtom.ts`     | Manages the Github API domain using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the Github API domain stored in browser extension storage. Provides methods to set and clear (reset to default) the domain.                                                                                                         | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useGithubTokenAtom.ts`         | Manages the GitHub API token using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the GitHub API token stored in browser extension storage. Provides methods to set and clear the token.                                                                                                          | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useModelClientTypeAtom.ts`     | Manages the model client type (OpenAI or Gemini) using Jotai and browser extension storage.         | - Synchronizes a Jotai atom with the model client type stored in browser extension storage. Provides methods to set and clear the type.                                                                                                            | - `jotai`<br>- `react`<br>- `../services/modelClient`                                                                                                                                           |
| `useOpenaiDomainAtom.ts`       | Manages the OpenAI API domain using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the OpenAI API domain stored in browser extension storage. Provides methods to set and clear (reset to default) the domain.                                                                                                          | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useOpenaiKeyAtom.ts`          | Manages the OpenAI API key using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the OpenAI API key stored in browser extension storage. Provides methods to set and clear the key.                                                                                                         | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `usePRData.ts`             | Manages PR data, loading, saving analysis results, and refreshing data.                            | - Loads PR data from storage or API.- Provides functions to save analysis summaries and checklists.- Provides functions to refresh and reload PR data.  -Calculates and monitors approval percentage.                                         | - `react`<br>- `jotai`<br>- `../types`<br>- `../services/prDataService`<br>- `@src/atoms/generatingAtom`<br>- `./prDataLoader`<br>- `../utils/prApprovalUtils`                            |

## Code Style and Examples

### Jotai Atom with Storage Synchronization

This pattern is used to manage global states that need to be persisted.

```typescript
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { someStorage } from '@extension/storage';

// Define the atom with a default value.
const someValueAtom = atom<string>('default');

export function useSomeValueAtom() {
  const [someValue, setSomeValue] = useAtom(someValueAtom);

  useEffect(() => {
    let mounted = true;
    someStorage.get().then(val => {
      if (mounted) setSomeValue(val);
    });
    return () => {
      mounted = false;
    };
  }, [setSomeValue]);

  const setValueAndStorage = async (newValue: string) => {
    await someStorage.set(newValue);
    setSomeValue(newValue);
  };

  const clearValue = async () => {
    await someStorage.clear();
    setSomeValue('default');
  };

  return { someValue, setValueAndStorage, clearValue } as const;
}
```

## File Templates and Explanations

### Custom Hook Template

```typescript
import { useState, useEffect } from 'react';

export function useMyCustomHook(initialValue: any) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Perform side effects here
  }, [state]);

  const updateState = (newValue: any) => {
    setState(newValue);
  };

  return {
    state,
    updateState,
  };
}
```

Explanation:

-   **`useMyCustomHook`:** Name your hook with the `use` prefix.
-   **`initialValue`:** Pass initial values as arguments to the hook.
-   **`useState`:** Use `useState` to manage component-specific state.
-   **`useEffect`:** Use `useEffect` for side effects, such as data fetching or subscriptions.
-   **`updateState`:** Expose functions to modify the state.
-   **Return:** Return an object containing the state and functions to interact with it.

## Coding Rules Based on the Above

1.  **Hook Naming:** Always start custom hook names with `use`.
2.  **Atom Naming:** Always name atoms with the noun they represent followed by `Atom`.
3.  **Single Responsibility:** Each hook should have a clear and focused responsibility.
4.  **Storage Interaction:** When interacting with storage, use the provided storage services (e.g., `@extension/storage`).
5.  **Error Handling:** Handle errors in asynchronous operations and provide appropriate feedback to the user.
6.  **Loading States:** Indicate loading states while performing asynchronous operations.
7.  **Jotai with Storage:** Use the Jotai atom pattern with storage synchronization for global persisted states.
8.  **Side Effect Handling:** When loading data from persistent storage to Jotai atoms, handle the case when component unmounts to avoid memory leaks by using a `mounted` flag in the `useEffect`.

## Notes for Developers

-   When creating new hooks, consider whether the logic can be reused across multiple components.
-   Ensure that hooks handle loading states and errors appropriately.
-   When managing API keys or tokens, use secure storage mechanisms and avoid exposing them directly in the UI.
-   Follow the naming conventions and coding style guidelines outlined in this document.
-   Be mindful of performance implications when fetching data or performing complex calculations within hooks.
-   When synchronizing Jotai atoms with `localStorage`, handle the case when component unmounts to avoid memory leaks by using a `mounted` flag in the `useEffect`.

## prDataLoader.ts
```
import type { PRData, PRAnalysisResult } from '../types';
import { fetchPRData, prDataStorage } from '../services/prDataService';
import { extractPRInfoFromKey } from '@src/utils/prUtils';

export const loadPRDataFromAnySource = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setAnalysisResult: (result: PRAnalysisResult | undefined) => void,
  setError: (err: string | null) => void,
) => {
  const identifier = extractPRInfoFromKey(prKey);
  if (!identifier) {
    return;
  }
  try {
    const savedData = await prDataStorage.getFromStorage(prKey);
    if (savedData) {
      setPRData(savedData.data);
      if (savedData.analysisResult) {
        setAnalysisResult(savedData.analysisResult);
      } else {
        setAnalysisResult(undefined);
      }
    } else {
      const newData = await fetchPRData(identifier);
      if (newData) {
        setPRData(newData);
        await prDataStorage.saveToStorage(prKey, newData);
        setAnalysisResult(undefined);
      } else {
        setError('Failed to load PR data');
      }
    }
  } catch {
    console.error('Error in loadPRData');
    setError('An error occurred while loading PR data');
  }
};

export const fetchAndSetPRData = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setError: (err: string | null) => void,
  setIsLoading: (b: boolean) => void,
  analysisResult: PRAnalysisResult | undefined,
) => {
  const identifier = extractPRInfoFromKey(prKey);
  if (!identifier) return;
  setIsLoading(true);
  setError(null);
  try {
    const newData = await fetchPRData(identifier);
    if (newData) {
      setPRData(newData);
      await prDataStorage.saveToStorage(prKey, newData, analysisResult || undefined);
    } else {
      setError('Failed to refresh PR data');
    }
  } catch {
    setError('An error occurred while refreshing PR data');
  } finally {
    setIsLoading(false);
  }
};

```

## useGeminiKeyAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { geminiApiKeyStorage } from '../services/gemini';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const geminiKeyAtom = atom<string | undefined>(undefined);
const isGeminiKeyLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGeminiKeyAtom() {
  const [geminiKey, setGeminiKey] = useAtom(geminiKeyAtom);
  const [isGeminiKeyLoaded, setIsGeminiKeyLoaded] = useAtom(isGeminiKeyLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    geminiApiKeyStorage.get().then(val => {
      if (mounted) setGeminiKey(val || undefined);
      setIsGeminiKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGeminiKey, setIsGeminiKeyLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setKeyAndStorage = async (newKey: string) => {
    await geminiApiKeyStorage.set(newKey);
    setGeminiKey(newKey);
  };

  // remover: キーをクリア
  const clearKey = async () => {
    await geminiApiKeyStorage.clear();
    setGeminiKey(undefined);
  };

  return { geminiKey, setKeyAndStorage, clearKey, isGeminiKeyLoaded } as const;
}

```

## useGithubApiDomainAtom.ts
```
import { atom, useAtom } from 'jotai';
import { githubApiDomainStorage } from '@extension/storage';
import { useEffect } from 'react';

// jotai atom: 初期値はnull、ロード時にstorageから取得
const githubApiDomainAtom = atom<string>('https://api.github.com');

// storageの値をjotai atomに同期するカスタムフック
export function useGithubApiDomainAtom() {
  const [githubDomain, setGithubDomain] = useAtom(githubApiDomainAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    githubApiDomainStorage.get().then(val => {
      if (mounted) setGithubDomain(val);
    });
    return () => {
      mounted = false;
    };
  }, [setGithubDomain]);

  // setter: jotai atomとstorage両方を更新
  const setDomainAndStorage = async (newDomain: string) => {
    await githubApiDomainStorage.set(newDomain);
    setGithubDomain(newDomain);
  };

  // remover: デフォルト値にリセット
  const clearDomain = async () => {
    await githubApiDomainStorage.clear();
    setGithubDomain('https://api.github.com');
  };

  return { githubDomain, setDomainAndStorage, clearDomain } as const;
}

```

## useGithubTokenAtom.ts
```
import { atom, useAtom } from 'jotai';
import { githubTokenStorage } from '@extension/storage';
import { useEffect } from 'react';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const githubTokenAtom = atom<string | undefined>(undefined);
const isGithubTokenLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGithubTokenAtom() {
  const [githubToken, setGithubToken] = useAtom(githubTokenAtom);
  const [isGithubTokenLoaded, setIsGithubTokenLoaded] = useAtom(isGithubTokenLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    githubTokenStorage.get().then(val => {
      if (mounted) setGithubToken(val);
      setIsGithubTokenLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGithubToken, setIsGithubTokenLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setTokenAndStorage = async (newToken: string) => {
    await githubTokenStorage.set(newToken);
    setGithubToken(newToken);
  };

  // remover: トークンをクリア
  const clearToken = async () => {
    await githubTokenStorage.clear();
    setGithubToken(undefined);
  };

  return { githubToken, setTokenAndStorage, clearToken, isGithubTokenLoaded } as const;
}

```

## useModelClientTypeAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { ModelClientType, modelClientTypeStorage } from '../services/modelClient';

// 型定義
export type ModelClientTypeAtomType = ModelClientType;

export const modelClientTypeAtom = atom<ModelClientType>(ModelClientType.OpenAI);

/**
 * モデルクライアント種別（OpenAI/Gemini）を管理するカスタムフック
 * - グローバル状態とストレージを同期
 */
export function useModelClientTypeAtom() {
  const [modelClientType, setModelClientType] = useAtom(modelClientTypeAtom);

  // 初期化時にストレージから取得
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await modelClientTypeStorage.get();
      if (mounted && saved) setModelClientType(saved);
    })();
    return () => {
      mounted = false;
    };
  }, [setModelClientType]);

  // setter
  const setTypeAndStorage = async (type: ModelClientType) => {
    await modelClientTypeStorage.set(type);
    setModelClientType(type);
  };

  // remover
  const clearType = async () => {
    await modelClientTypeStorage.clear();
    setModelClientType(ModelClientType.OpenAI);
  };

  return { modelClientType, setTypeAndStorage, clearType } as const;
}

```

## useOpenaiDomainAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiApiEndpointStorage } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const openaiDomainAtom = atom<string>('https://api.openai.com/v1');
const isOpenaiDomainLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useOpenaiDomainAtom() {
  const [openaiDomain, setOpenaiDomain] = useAtom(openaiDomainAtom);
  const [isOpenaiDomainLoaded, setIsOpenaiDomainLoaded] = useAtom(isOpenaiDomainLoadedAtom);

  useEffect(() => {
    let mounted = true;
    openaiApiEndpointStorage.get().then(val => {
      if (mounted) setOpenaiDomain(val);
      setIsOpenaiDomainLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiDomain, setIsOpenaiDomainLoaded]);

  const setDomainAndStorage = async (newDomain: string) => {
    await openaiApiEndpointStorage.set(newDomain);
    setOpenaiDomain(newDomain);
  };

  const clearDomain = async () => {
    await openaiApiEndpointStorage.clear();
    setOpenaiDomain('https://api.openai.com');
  };

  return { openaiDomain, setDomainAndStorage, clearDomain, isOpenaiDomainLoaded } as const;
}

```

## useOpenaiKeyAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiApiKeyStorage } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const openaiKeyAtom = atom<string | undefined>(undefined);
const isOpenaiKeyLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useOpenaiKeyAtom() {
  const [openaiKey, setOpenaiKey] = useAtom(openaiKeyAtom);
  const [isOpenaiKeyLoaded, setIsOpenaiKeyLoaded] = useAtom(isOpenaiKeyLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    openaiApiKeyStorage.get().then(val => {
      if (mounted) setOpenaiKey(val || undefined);
      setIsOpenaiKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiKey, setIsOpenaiKeyLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setKeyAndStorage = async (newKey: string) => {
    await openaiApiKeyStorage.set(newKey);
    setOpenaiKey(newKey);
  };

  // remover: キーをクリア
  const clearKey = async () => {
    await openaiApiKeyStorage.clear();
    setOpenaiKey(undefined);
  };

  return { openaiKey, setKeyAndStorage, clearKey, isOpenaiKeyLoaded } as const;
}

```

## usePRData.ts
```
import { useState, useEffect } from 'react';
import { useAtom, atom } from 'jotai';
import type { PRData, PRAnalysisResult, Checklist } from '../types';
import { prDataStorage } from '../services/prDataService';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { loadPRDataFromAnySource, fetchAndSetPRData } from './prDataLoader';
import { getApprovedFiles, getApprovalPercentage } from '../utils/prApprovalUtils';

const currentPrDataAtom = atom<PRData | null>(null);

// PRデータを管理するためのカスタムフック
export function usePRData(prKey: string) {
  const [prData, setPRData] = useAtom(currentPrDataAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PRAnalysisResult | undefined>(undefined);
  const [previousApprovalPercentage, setPreviousApprovalPercentage] = useState<number | null>(null);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [isGenerating] = useAtom(generatingAtom);

  // PR情報を取得する関数
  useEffect(() => {
    if (isGenerating) return;
    setPreviousApprovalPercentage(null);
    setIsJustCompleted(false);
    setIsLoading(true);
    setError(null);
    loadPRDataFromAnySource(prKey, setPRData, setAnalysisResult, setError).finally(() => setIsLoading(false));
  }, [prKey, isGenerating, setPRData]);

  // 分析結果を保存する関数
  const saveAnalysisResultSummary = async (summary: string) => {
    if (!prData || !prKey) return;

    const newResult = {
      ...analysisResult,
      summary,
    } as PRAnalysisResult;

    setAnalysisResult(newResult);

    try {
      await prDataStorage.saveToStorage(prKey, prData, newResult);
    } catch (err) {
      console.error('Error saving analysis result:', err);
    }
  };

  const saveAnalysisResultChecklist = async (fileChecklist: Checklist) => {
    if (!prData || !prKey) return;

    let newFileAnalysis: Checklist[];

    // すでに分析結果にchecklistと同じファイル名が存在する場合は更新
    if (analysisResult?.fileAnalysis?.some(item => item.filename === fileChecklist.filename)) {
      newFileAnalysis = analysisResult.fileAnalysis.map(item =>
        item.filename === fileChecklist.filename ? fileChecklist : item,
      );
    } else {
      // 含まれない場合は新しいチェックリストを追加
      newFileAnalysis = (analysisResult?.fileAnalysis || []).concat(fileChecklist);
    }

    const newResult = {
      ...analysisResult,
      fileAnalysis: newFileAnalysis,
    } as PRAnalysisResult;

    setAnalysisResult(newResult);

    try {
      await prDataStorage.saveToStorage(prKey, prData, newResult);
    } catch (err) {
      console.error('Error saving analysis result:', err);
    }
  };

  // データを強制的に再読み込みする関数
  const refreshData = async () => {
    if (!prKey) return;

    await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading, analysisResult);
  };

  // PRデータをAPIから再取得して状態を更新する関数
  const reloadPRData = async () => {
    if (!prKey) return null;
    setIsLoading(true);
    setError(null);
    try {
      await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading, analysisResult);
      return prData;
    } catch {
      setError('Failed to reload PR data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 現在の承認状態を計算
  const approvedFilesCount = prData && analysisResult ? getApprovedFiles(prData, analysisResult) : 0;

  const currentApprovalPercentage = prData && analysisResult ? getApprovalPercentage(prData, analysisResult) : null;

  // 承認率の変化を監視し、完了状態を検出する
  useEffect(() => {
    if (currentApprovalPercentage === 100 && previousApprovalPercentage !== null && previousApprovalPercentage < 100) {
      setIsJustCompleted(true);
    } else if (currentApprovalPercentage !== previousApprovalPercentage) {
      setIsJustCompleted(false);
      setPreviousApprovalPercentage(currentApprovalPercentage);
    }
  }, [currentApprovalPercentage, previousApprovalPercentage]);

  // isJustCompletedがtrueになったら5秒後にfalseに戻す
  useEffect(() => {
    if (isJustCompleted) {
      const timer = setTimeout(() => {
        setIsJustCompleted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isJustCompleted]);

  return {
    prData,
    isLoading,
    error,
    analysisResult,
    saveAnalysisResultSummary,
    saveAnalysisResultChecklist,
    refreshData,
    reloadPRData,
    approvedFilesCount,
    currentApprovalPercentage,
    isJustCompleted,
  };
}

```