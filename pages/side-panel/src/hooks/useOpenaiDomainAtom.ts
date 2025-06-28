import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiApiEndpointStorage } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const openaiDomainAtom = atom<string>('https://api.openai.com/v1');
const isOpenaiDomainLoadedAtom = atom<boolean>(false);

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
