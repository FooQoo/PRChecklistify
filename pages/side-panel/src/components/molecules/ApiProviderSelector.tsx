import type React from 'react';
import { getAllLLMProviders } from '@src/utils/configLoader';
import { isGeminiApiEnabled } from '@src/utils/envUtils';
import { useI18n } from '@extension/i18n';
import type { ModelClientType } from '@extension/storage';

interface ApiProviderSelectorProps {
  modelClientType: ModelClientType;
  onProviderChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ApiProviderSelector: React.FC<ApiProviderSelectorProps> = ({ modelClientType, onProviderChange, onToast }) => {
  const { t } = useI18n();
  const geminiEnabled = isGeminiApiEnabled();
  const llmProviders = getAllLLMProviders();

  // プロバイダー変更のハンドラー
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const previousProvider = modelClientType;
    const newProvider = e.target.value;

    // 元のハンドラーを呼び出し
    onProviderChange(e);

    // プロバイダーが実際に変更された場合にToastを表示
    if (previousProvider !== newProvider && onToast) {
      onToast(t('aiProviderChangedSuccess'), 'success');
    }
  };

  const getProviderOptions = () => {
    return llmProviders
      .filter(provider => provider.id !== 'gemini' || geminiEnabled)
      .map(provider => ({
        id: provider.id,
        name: provider.name,
      }));
  };

  const providerOptions = getProviderOptions();

  return (
    <div className="mb-4">
      <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
        {t('selectAiProvider')}
      </label>
      <select
        id="provider-select"
        value={modelClientType}
        onChange={handleProviderChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {providerOptions.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ApiProviderSelector;
