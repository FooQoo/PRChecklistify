import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { claudeModelStorage } from '@extension/storage';

export const claudeModelAtom = atom<string>('claude-3-sonnet-20240229');
const isClaudeModelLoadedAtom = atom<boolean>(false);

export function useClaudeModelAtom() {
  const [claudeModel, setClaudeModel] = useAtom(claudeModelAtom);
  const [isClaudeModelLoaded, setIsClaudeModelLoaded] = useAtom(isClaudeModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    claudeModelStorage.get().then(val => {
      if (mounted && val) setClaudeModel(val);
      setIsClaudeModelLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setClaudeModel, setIsClaudeModelLoaded]);

  const setModelAndStorage = async (model: string) => {
    await claudeModelStorage.set(model);
    setClaudeModel(model);
  };

  return { claudeModel, setModelAndStorage, isClaudeModelLoaded } as const;
}
