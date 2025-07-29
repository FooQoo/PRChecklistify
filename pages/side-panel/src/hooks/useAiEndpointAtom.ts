import { atom, useAtom } from 'jotai';
import { aiEndpointStorage, DEFAULT_AI_ENDPOINTS } from '@extension/storage';
import { useEffect } from 'react';
import type { AIEndpointConfig, ModelClientType } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const aiEndpointAtom = atom<AIEndpointConfig | undefined>(undefined);
const isAiEndpointLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useAiEndpointAtom() {
  const [aiEndpointConfig, setAiEndpointConfig] = useAtom(aiEndpointAtom);
  const [isAiEndpointLoaded, setIsAiEndpointLoaded] = useAtom(isAiEndpointLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        // Load the current configuration
        const config = await aiEndpointStorage.get();
        if (mounted) {
          setAiEndpointConfig(config);
          setIsAiEndpointLoaded(true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        if (mounted) {
          setIsAiEndpointLoaded(true);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [setAiEndpointConfig, setIsAiEndpointLoaded]);

  // Update endpoint for a specific provider
  const updateEndpoint = async (providerId: ModelClientType, endpoint: string) => {
    await aiEndpointStorage.updateEndpoint(providerId, endpoint);
    const updatedConfig = await aiEndpointStorage.get();
    setAiEndpointConfig(updatedConfig);
  };

  // Reset endpoint to default for a specific provider
  const resetEndpoint = async (providerId: ModelClientType) => {
    await aiEndpointStorage.resetEndpoint(providerId);
    const updatedConfig = await aiEndpointStorage.get();
    setAiEndpointConfig(updatedConfig);
  };

  // Get endpoint for a specific provider
  const getEndpoint = (providerId: ModelClientType): string => {
    if (!aiEndpointConfig) {
      return DEFAULT_AI_ENDPOINTS[providerId];
    }
    const endpointKey = `${providerId}ApiEndpoint` as keyof AIEndpointConfig;
    return aiEndpointConfig[endpointKey] as string;
  };

  // Check if endpoint is custom (different from default)
  const isCustomEndpoint = (providerId: ModelClientType): boolean => {
    const currentEndpoint = getEndpoint(providerId);
    return currentEndpoint !== DEFAULT_AI_ENDPOINTS[providerId];
  };

  // Clear all endpoint settings
  const clearEndpoints = async () => {
    await aiEndpointStorage.clear();
    const updatedConfig = await aiEndpointStorage.get();
    setAiEndpointConfig(updatedConfig);
  };

  return {
    aiEndpointConfig,
    updateEndpoint,
    resetEndpoint,
    getEndpoint,
    isCustomEndpoint,
    clearEndpoints,
    isAiEndpointLoaded,
  } as const;
}
