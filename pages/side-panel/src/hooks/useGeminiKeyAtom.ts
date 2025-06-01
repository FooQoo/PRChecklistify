import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { geminiApiKeyStorage } from '../services/gemini';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const geminiKeyAtom = atom<string | undefined>(undefined);
const isGeminiKeyLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGeminiKeyAtom() {
  const [geminiKey, setGeminiKey] = useAtom(geminiKeyAtom);
  const [isGeminiKeyLoaded, setIsGeminiKeyLoaded] = useAtom(isGeminiKeyLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    geminiApiKeyStorage.get().then(val => {
      if (mounted) setGeminiKey(val || undefined);
      setIsGeminiKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGeminiKey, setIsGeminiKeyLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setKeyAndStorage = async (newKey: string) => {
    await geminiApiKeyStorage.set(newKey);
    setGeminiKey(newKey);
  };

  // remover: キーをクリア
  const clearKey = async () => {
    await geminiApiKeyStorage.clear();
    setGeminiKey(undefined);
  };

  return { geminiKey, setKeyAndStorage, clearKey, isGeminiKeyLoaded } as const;
}
