import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiModelStorage } from '@extension/storage';

export const openaiModelAtom = atom<string>('gpt-4o');
const isOpenaiModelLoadedAtom = atom<boolean>(false);

export function useOpenaiModelAtom() {
  const [openaiModel, setOpenaiModel] = useAtom(openaiModelAtom);
  const [isLoaded, setIsLoaded] = useAtom(isOpenaiModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    openaiModelStorage.get().then(val => {
      if (mounted) setOpenaiModel(val);
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiModel, setIsLoaded]);

  const setModelAndStorage = async (model: string) => {
    await openaiModelStorage.set(model);
    setOpenaiModel(model);
  };

  return { openaiModel, setModelAndStorage, isOpenaiModelLoaded: isLoaded } as const;
}
