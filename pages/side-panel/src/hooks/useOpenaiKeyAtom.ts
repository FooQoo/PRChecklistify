import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiApiKeyStorage } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const openaiKeyAtom = atom<string | undefined>(undefined);
const isOpenaiKeyLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useOpenaiKeyAtom() {
  const [openaiKey, setOpenaiKey] = useAtom(openaiKeyAtom);
  const [isOpenaiKeyLoaded, setIsOpenaiKeyLoaded] = useAtom(isOpenaiKeyLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    openaiApiKeyStorage.get().then(val => {
      if (mounted) setOpenaiKey(val || undefined);
      setIsOpenaiKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiKey, setIsOpenaiKeyLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setKeyAndStorage = async (newKey: string) => {
    await openaiApiKeyStorage.set(newKey);
    setOpenaiKey(newKey);
  };

  // remover: キーをクリア
  const clearKey = async () => {
    await openaiApiKeyStorage.clear();
    setOpenaiKey(undefined);
  };

  return { openaiKey, setKeyAndStorage, clearKey, isOpenaiKeyLoaded } as const;
}
