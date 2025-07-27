import { atom, useAtom } from 'jotai';
import { githubServersStorage } from '@extension/storage';
import { useEffect } from 'react';
import type { GitHubServer } from '@extension/storage';
import { initGitHubServersFromBuildConfigIfEmpty } from '@src/utils/configLoader';

// jotai atom: 初期値は空配列、ロード時にstorageから取得
export const githubServersAtom = atom<GitHubServer[]>([]);
const isGithubServersLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGithubServersAtom() {
  const [githubServers, setGithubServers] = useAtom(githubServersAtom);
  const [isGithubServersLoaded, setIsGithubServersLoaded] = useAtom(isGithubServersLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;

    const loadServers = async () => {
      try {
        // Initialize servers from build config if storage is empty
        await initGitHubServersFromBuildConfigIfEmpty();

        // Load the current configuration
        const servers = await githubServersStorage.getAllServers();
        if (mounted) {
          // Ensure servers is always an array
          setGithubServers(Array.isArray(servers) ? servers : []);
          setIsGithubServersLoaded(true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        if (mounted) {
          // Set empty array as fallback
          setGithubServers([]);
          setIsGithubServersLoaded(true);
        }
      }
    };

    loadServers();

    return () => {
      mounted = false;
    };
  }, [setGithubServers, setIsGithubServersLoaded]);

  // Add a new server
  const addServer = async (server: GitHubServer) => {
    await githubServersStorage.addServer(server);
    const updatedServers = await githubServersStorage.getAllServers();
    setGithubServers(Array.isArray(updatedServers) ? updatedServers : []);
  };

  // Update an existing server
  const updateServer = async (serverId: string, serverUpdate: Partial<GitHubServer>) => {
    await githubServersStorage.updateServer(serverId, serverUpdate);
    const updatedServers = await githubServersStorage.getAllServers();
    setGithubServers(Array.isArray(updatedServers) ? updatedServers : []);
  };

  // Remove a server
  const removeServer = async (serverId: string) => {
    await githubServersStorage.removeServer(serverId);
    const updatedServers = await githubServersStorage.getAllServers();
    setGithubServers(Array.isArray(updatedServers) ? updatedServers : []);
  };

  // Get a specific server
  const getServer = (serverId: string): GitHubServer | undefined => {
    return (githubServers || []).find(s => s.id === serverId);
  };

  return {
    githubServers,
    addServer,
    updateServer,
    removeServer,
    getServer,
    isGithubServersLoaded,
  } as const;
}
