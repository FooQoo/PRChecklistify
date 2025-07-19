/**
 * 指定されたproviderのデフォルトモデルを取得する
 * @param providerId - プロバイダーのID
 * @returns デフォルトモデルのID、プロバイダーが見つからない場合はエラー
 */
export function getDefaultModelByProvider(providerId: string): string {
  const provider = __LLM_CONFIG__.llmServices.providers.find(p => p.id === providerId);
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }
  return provider.defaultModel;
}
