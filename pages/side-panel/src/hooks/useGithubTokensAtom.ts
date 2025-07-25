import { atom, useAtom } from 'jotai';
import { githubTokensStorage } from '@extension/storage';
import { useEffect } from 'react';
import type { GitHubTokensConfiguration } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const githubTokensAtom = atom<GitHubTokensConfiguration | undefined>(undefined);
const isGithubTokensLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGithubTokensAtom() {
  const [githubTokens, setGithubTokens] = useAtom(githubTokensAtom);
  const [isGithubTokensLoaded, setIsGithubTokensLoaded] = useAtom(isGithubTokensLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        // Load the current configuration
        const config = await githubTokensStorage.get();
        if (mounted) {
          setGithubTokens(config);
          setIsGithubTokensLoaded(true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        if (mounted) {
          setIsGithubTokensLoaded(true);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [setGithubTokens, setIsGithubTokensLoaded]);

  // Set token for a server
  const setToken = async (serverId: string, token: string) => {
    await githubTokensStorage.setToken(serverId, token);
    const updatedConfig = await githubTokensStorage.get();
    setGithubTokens(updatedConfig);
  };

  // Get token for a server
  const getToken = (serverId: string): string | undefined => {
    return githubTokens?.tokens.find(t => t.serverId === serverId)?.token;
  };

  // Remove token for a server
  const removeToken = async (serverId: string) => {
    await githubTokensStorage.removeToken(serverId);
    const updatedConfig = await githubTokensStorage.get();
    setGithubTokens(updatedConfig);
  };

  // Set active server
  const setActiveServer = async (serverId: string) => {
    await githubTokensStorage.setActiveServer(serverId);
    const updatedConfig = await githubTokensStorage.get();
    setGithubTokens(updatedConfig);
  };

  // Get active server ID
  const getActiveServerId = (): string | undefined => {
    return githubTokens?.activeServerId;
  };

  // Clear all tokens
  const clearTokens = async () => {
    await githubTokensStorage.clear();
    const updatedConfig = await githubTokensStorage.get();
    setGithubTokens(updatedConfig);
  };

  return {
    githubTokens,
    setToken,
    getToken,
    removeToken,
    setActiveServer,
    getActiveServerId,
    clearTokens,
    isGithubTokensLoaded,
  } as const;
}
