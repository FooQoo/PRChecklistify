import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { claudeModelStorage } from '@extension/storage';
import { getDefaultModelByProvider } from '@src/utils/defaultModel';

export const claudeModelAtom = atom<string>('');
const isClaudeModelLoadedAtom = atom<boolean>(false);

export function useClaudeModelAtom() {
  const [claudeModel, setClaudeModel] = useAtom(claudeModelAtom);
  const [isClaudeModelLoaded, setIsClaudeModelLoaded] = useAtom(isClaudeModelLoadedAtom);

  useEffect(() => {
    let mounted = true;
    claudeModelStorage.get().then(val => {
      if (mounted && val) {
        setClaudeModel(val);
      } else if (!val) {
        const defaultModel = getDefaultModelByProvider('claude');
        setClaudeModel(defaultModel);
        claudeModelStorage.set(defaultModel);
      }
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
