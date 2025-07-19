import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { ModelClientType, modelClientTypeStorage } from '@extension/storage';

const modelClientTypeAtom = atom<ModelClientType>(ModelClientType.OpenAI);

/**
 * モデルクライアント種別（OpenAI/Gemini）を管理するカスタムフック
 * - グローバル状態とストレージを同期
 */
export function useModelClientTypeAtom() {
  const [modelClientType, setModelClientType] = useAtom(modelClientTypeAtom);

  // 初期化時にストレージから取得
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await modelClientTypeStorage.get();
      if (mounted) setModelClientType(saved);
    })();
    return () => {
      mounted = false;
    };
  }, [setModelClientType]);

  // setter
  const setTypeAndStorage = async (type: ModelClientType) => {
    await modelClientTypeStorage.set(type);
    setModelClientType(type);
  };

  // remover
  const clearType = async () => {
    await modelClientTypeStorage.set(ModelClientType.OpenAI);
    setModelClientType(ModelClientType.OpenAI);
  };

  return { modelClientType, setTypeAndStorage, clearType } as const;
}
