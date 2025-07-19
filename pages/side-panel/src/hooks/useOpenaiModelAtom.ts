import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiModelStorage } from '@extension/storage';

export const openaiModelAtom = atom<string>('');
const isOpenaiModelLoadedAtom = atom<boolean>(false);

export function useOpenaiModelAtom() {
  const [openaiModel, setOpenaiModel] = useAtom(openaiModelAtom);
  const [isOpenaiModelLoaded, setIsOpenaiModelLoaded] = useAtom(isOpenaiModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    openaiModelStorage.get().then(val => {
      if (mounted && val) setOpenaiModel(val);
      setIsOpenaiModelLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiModel, setIsOpenaiModelLoaded]);

  const setModelAndStorage = async (model: string) => {
    await openaiModelStorage.set(model);
    setOpenaiModel(model);
  };

  return { openaiModel, setModelAndStorage, isOpenaiModelLoaded } as const;
}
