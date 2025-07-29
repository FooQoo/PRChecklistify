import type React from 'react';
import { useI18n } from '@extension/i18n';
import { TextInput } from '@src/components/molecules';
import type { ModelClientType } from '@extension/storage';
import { DEFAULT_AI_ENDPOINTS } from '@extension/storage';

interface EndpointConfigurationProps {
  modelClientType: ModelClientType;
  currentEndpoint: string;
  isCustom: boolean;
  onEndpointSave: (endpoint: string) => Promise<void>;
  onEndpointReset: () => Promise<void>;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const EndpointConfiguration: React.FC<EndpointConfigurationProps> = ({
  modelClientType,
  currentEndpoint,
  isCustom,
  onEndpointSave,
  onEndpointReset,
  onToast,
}) => {
  const { t } = useI18n();

  const getEndpointLabel = () => {
    switch (modelClientType) {
      case 'openai':
        return t('openaiApiEndpoint');
      case 'gemini':
        return t('geminiApiEndpoint');
      case 'claude':
        return t('claudeApiEndpoint');
      default:
        return t('apiEndpoint');
    }
  };

  const getEndpointDescription = () => {
    switch (modelClientType) {
      case 'openai':
        return t('openaiEndpointDescription');
      case 'gemini':
        return t('geminiEndpointDescription');
      case 'claude':
        return t('claudeEndpointDescription');
      default:
        return t('endpointDescription');
    }
  };

  const validateEndpoint = (endpoint: string): boolean => {
    try {
      const url = new URL(endpoint);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const defaultEndpoint = DEFAULT_AI_ENDPOINTS[modelClientType];

  return (
    <div className="space-y-3">
      <TextInput
        label={getEndpointLabel()}
        value={currentEndpoint}
        placeholder={defaultEndpoint}
        type="text"
        onSave={onEndpointSave}
        onReset={isCustom ? onEndpointReset : undefined}
        validator={validateEndpoint}
        errorMessage={t('invalidEndpointFormat')}
        successMessage={t('endpointSavedSuccess')}
        resetText={t('resetToDefault')}
        saveText={t('save')}
        savingText={t('saving')}
        keySetText={isCustom ? t('customEndpointSet') : t('defaultEndpointSet')}
        keyNotSetText={t('endpointNotSet')}
        onToast={onToast}
      />
      <div className="text-xs text-gray-500">
        <p>{getEndpointDescription()}</p>
        {isCustom && <p className="mt-1 text-blue-600">{t('customEndpointWarning')}</p>}
        <p className="mt-1">
          <span className="font-medium">{t('defaultEndpoint')}: </span>
          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{defaultEndpoint}</code>
        </p>
      </div>
    </div>
  );
};

export default EndpointConfiguration;
