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
