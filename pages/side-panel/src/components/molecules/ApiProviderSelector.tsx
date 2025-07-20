import type React from 'react';
import { getAllLLMProviders } from '../../services/configLoader';
import { isGeminiApiEnabled } from '../../utils/envUtils';
import { useI18n } from '@extension/i18n';
import type { ModelClientType } from '../../services/modelClient';

interface ApiProviderSelectorProps {
  modelClientType: ModelClientType;
  onProviderChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ApiProviderSelector: React.FC<ApiProviderSelectorProps> = ({ modelClientType, onProviderChange }) => {
  const { t } = useI18n();
  const geminiEnabled = isGeminiApiEnabled();
  const llmProviders = getAllLLMProviders();

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
        onChange={onProviderChange}
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
