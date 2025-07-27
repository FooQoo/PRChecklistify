import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { githubServersStorage } from '@extension/storage';
import type { GitHubServersConfiguration, GitHubServer } from '@extension/storage';

export const githubServersAtom = atom<GitHubServersConfiguration | undefined>(undefined);
const isGithubServersLoadedAtom = atom<boolean>(false);

export function useGithubServersAtom() {
  const [githubServers, setGithubServers] = useAtom(githubServersAtom);
  const [isLoaded, setIsLoaded] = useAtom(isGithubServersLoadedAtom);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const config = await githubServersStorage.get();
        if (mounted) {
          setGithubServers(config);
          setIsLoaded(true);
        }
      } catch {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [setGithubServers, setIsLoaded]);

  const addServer = async (server: GitHubServer) => {
    await githubServersStorage.addServer(server);
    const updated = await githubServersStorage.get();
    setGithubServers(updated);
  };

  const removeServer = async (serverId: string) => {
    await githubServersStorage.removeServer(serverId);
    const updated = await githubServersStorage.get();
    setGithubServers(updated);
  };

  const clearServers = async () => {
    await githubServersStorage.clear();
    const updated = await githubServersStorage.get();
    setGithubServers(updated);
  };

  const servers = githubServers?.servers ?? [];

  return {
    servers,
    addServer,
    removeServer,
    clearServers,
    isGithubServersLoaded: isLoaded,
  } as const;
}
