import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { mcpJsonStorage } from '@extension/storage';

// jotai atom: 初期値は空文字列、ロード時にstorageから取得
export const mcpJsonAtom = atom<string>('');
const isMcpJsonLoadedAtom = atom<boolean>(false);

/**
 * MCP用JSON設定を管理するカスタムフック
 * - jotai atomとchrome.storageを同期
 */
export function useMcpJsonAtom() {
  const [mcpJson, setMcpJson] = useAtom(mcpJsonAtom);
  const [isMcpJsonLoaded, setIsMcpJsonLoaded] = useAtom(isMcpJsonLoadedAtom);

  // 初回マウント時にchrome.storageから値を取得
  useEffect(() => {
    let mounted = true;
    mcpJsonStorage.get().then(val => {
      if (mounted) setMcpJson(val);
      setIsMcpJsonLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setMcpJson, setIsMcpJsonLoaded]);

  // setter: jotai atomとchrome.storage両方を更新
  const setJsonAndStorage = async (json: string) => {
    await mcpJsonStorage.set(json);
    setMcpJson(json);
  };

  // remover: 設定をクリア
  const clearJson = async () => {
    await mcpJsonStorage.clear();
    setMcpJson('');
  };

  return { mcpJson, setJsonAndStorage, clearJson, isMcpJsonLoaded } as const;
}
