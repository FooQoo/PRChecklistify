import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { claudeModelStorage } from '@extension/storage';

export const claudeModelAtom = atom<string>('claude-3-opus-20240229');
const isClaudeModelLoadedAtom = atom<boolean>(false);

export function useClaudeModelAtom() {
  const [claudeModel, setClaudeModel] = useAtom(claudeModelAtom);
  const [isLoaded, setIsLoaded] = useAtom(isClaudeModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    claudeModelStorage.get().then(val => {
      if (mounted) setClaudeModel(val);
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setClaudeModel, setIsLoaded]);

  const setModelAndStorage = async (model: string) => {
    await claudeModelStorage.set(model);
    setClaudeModel(model);
  };

  return { claudeModel, setModelAndStorage, isClaudeModelLoaded: isLoaded } as const;
}
