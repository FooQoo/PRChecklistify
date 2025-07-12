import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { claudeApiKeyStorage } from '@extension/storage';

export const claudeKeyAtom = atom<string | undefined>(undefined);
const isClaudeKeyLoadedAtom = atom<boolean>(false);

export function useClaudeKeyAtom() {
  const [claudeKey, setClaudeKey] = useAtom(claudeKeyAtom);
  const [isClaudeKeyLoaded, setIsClaudeKeyLoaded] = useAtom(isClaudeKeyLoadedAtom);

  useEffect(() => {
    let mounted = true;
    claudeApiKeyStorage.get().then(val => {
      if (mounted) setClaudeKey(val || undefined);
      setIsClaudeKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setClaudeKey, setIsClaudeKeyLoaded]);

  const setKeyAndStorage = async (newKey: string) => {
    await claudeApiKeyStorage.set(newKey);
    setClaudeKey(newKey);
  };

  const clearKey = async () => {
    await claudeApiKeyStorage.clear();
    setClaudeKey(undefined);
  };

  return { claudeKey, setKeyAndStorage, clearKey, isClaudeKeyLoaded } as const;
}
