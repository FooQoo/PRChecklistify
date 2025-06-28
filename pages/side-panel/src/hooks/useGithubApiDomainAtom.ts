import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { githubApiDomainStorage } from '@extension/storage';

// jotai atom: 初期値はnull、ロード時にstorageから取得
const githubApiDomainAtom = atom<string>('https://api.github.com');

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
