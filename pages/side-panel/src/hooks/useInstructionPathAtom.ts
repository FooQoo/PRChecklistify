import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { instructionPathStorage } from '@extension/storage';

export const instructionPathAtom = atom<string>('');
const isInstructionPathLoadedAtom = atom<boolean>(false);

export function useInstructionPathAtom() {
  const [path, setPath] = useAtom(instructionPathAtom);
  const [isLoaded, setIsLoaded] = useAtom(isInstructionPathLoadedAtom);

  useEffect(() => {
    let mounted = true;
    instructionPathStorage.get().then(val => {
      if (mounted) setPath(val);
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setPath, setIsLoaded]);

  const setPathAndStorage = async (newPath: string) => {
    await instructionPathStorage.set(newPath);
    setPath(newPath);
  };

  const clearPath = async () => {
    await instructionPathStorage.clear();
    setPath('');
  };

  return { path, setPathAndStorage, clearPath, isLoaded } as const;
}
