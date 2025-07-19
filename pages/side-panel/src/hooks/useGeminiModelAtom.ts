import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { geminiModelStorage } from '@extension/storage';
import { getDefaultModelByProvider } from '@src/utils/defaultModel';

export const geminiModelAtom = atom<string>('');
const isGeminiModelLoadedAtom = atom<boolean>(false);

export function useGeminiModelAtom() {
  const [geminiModel, setGeminiModel] = useAtom(geminiModelAtom);
  const [isGeminiModelLoaded, setIsGeminiModelLoaded] = useAtom(isGeminiModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    geminiModelStorage.get().then(val => {
      if (mounted && val) {
        setGeminiModel(val);
      } else if (!val) {
        const defaultModel = getDefaultModelByProvider('gemini');
        setGeminiModel(defaultModel);
        geminiModelStorage.set(defaultModel);
      }
      setIsGeminiModelLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGeminiModel, setIsGeminiModelLoaded]);

  const setModelAndStorage = async (model: string) => {
    await geminiModelStorage.set(model);
    setGeminiModel(model);
  };

  return { geminiModel, setModelAndStorage, isGeminiModelLoaded } as const;
}
