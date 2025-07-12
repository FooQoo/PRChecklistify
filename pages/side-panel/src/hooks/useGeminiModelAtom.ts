import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { geminiModelStorage } from '@extension/storage';

export const geminiModelAtom = atom<string>('gemini-1.5-pro');
const isGeminiModelLoadedAtom = atom<boolean>(false);

export function useGeminiModelAtom() {
  const [geminiModel, setGeminiModel] = useAtom(geminiModelAtom);
  const [isLoaded, setIsLoaded] = useAtom(isGeminiModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    geminiModelStorage.get().then(val => {
      if (mounted) setGeminiModel(val);
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGeminiModel, setIsLoaded]);

  const setModelAndStorage = async (model: string) => {
    await geminiModelStorage.set(model);
    setGeminiModel(model);
  };

  return { geminiModel, setModelAndStorage, isGeminiModelLoaded: isLoaded } as const;
}
