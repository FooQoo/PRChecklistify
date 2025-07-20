import type React from 'react';
import { getLLMProviderById } from '@src/utils/configLoader';
import { useI18n } from '@extension/i18n';
import type { ModelClientType } from '@src/repositories/ai/modelClient';

interface ModelSelectorProps {
  modelClientType: ModelClientType;
  currentModel: string;
  onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  htmlId: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ modelClientType, currentModel, onModelChange, htmlId }) => {
  const { t } = useI18n();

  // モデルオプションを統一形式で取得するヘルパー関数
  const getUnifiedModelOptions = (provider: ModelClientType) => {
    const providerInfo = getLLMProviderById(provider);
    if (providerInfo && providerInfo.models) {
      return providerInfo.models.map(model => ({
        key: model.id,
        value: model.id,
        label: model.name,
      }));
    }
    return [];
  };

  return (
    <div className="mb-4">
      <label htmlFor={htmlId} className="block text-sm font-medium text-gray-700 mb-1">
        {t('modelVersion')}
      </label>
      <select
        id={htmlId}
        value={currentModel}
        onChange={onModelChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        {getUnifiedModelOptions(modelClientType).map(model => (
          <option key={model.key} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
