import type React from 'react';
import { useI18n } from '@extension/i18n';
import { TextInput, EndpointConfiguration } from '@src/components/molecules';
import ModelSelector from '@src/components/molecules/ModelSelector';
import { getLLMProviderById } from '@src/utils/configLoader';
import type { ModelClientType } from '@extension/storage';
import { useAiEndpointAtom } from '@src/hooks/useAiEndpointAtom';

interface ApiKeyConfigurationProps {
  modelClientType: ModelClientType;
  apiKey: string | undefined;
  currentModel: string;
  onApiKeySave: (key: string) => Promise<void>;
  onApiKeyRemove: () => Promise<void>;
  onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ApiKeyConfiguration: React.FC<ApiKeyConfigurationProps> = ({
  modelClientType,
  apiKey,
  currentModel,
  onApiKeySave,
  onApiKeyRemove,
  onModelChange,
  onToast,
}) => {
  const { t } = useI18n();
  const currentProvider = getLLMProviderById(modelClientType);
  const { getEndpoint, isCustomEndpoint, updateEndpoint, resetEndpoint, isAiEndpointLoaded } = useAiEndpointAtom();

  // APIキーのマスク表示
  const getMaskedApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const getProviderTitle = () => {
    switch (modelClientType) {
      case 'openai':
        return t('openaiIntegration');
      case 'gemini':
        return t('geminiIntegration');
      case 'claude':
        return t('claudeIntegration');
      default:
        return t('apiConfiguration');
    }
  };

  const getApiKeyLabel = () => {
    switch (modelClientType) {
      case 'openai':
        return t('openaiApiKey');
      case 'gemini':
        return t('geminiApiKey');
      case 'claude':
        return t('claudeApiKey');
      default:
        return t('apiKey');
    }
  };

  const getSuccessMessage = () => {
    switch (modelClientType) {
      case 'openai':
        return t('apiKeySavedSuccess');
      case 'gemini':
        return t('geminiApiKeySavedSuccess');
      case 'claude':
        return t('claudeApiKeySavedSuccess');
      default:
        return t('apiKeySavedSuccess');
    }
  };

  const getErrorMessage = () => {
    switch (modelClientType) {
      case 'openai':
        return t('invalidApiKeyFormat');
      case 'gemini':
        return t('invalidGeminiApiKeyFormat');
      case 'claude':
        return t('invalidClaudeApiKeyFormat');
      default:
        return t('invalidApiKeyFormat');
    }
  };

  const getKeySetText = () => {
    switch (modelClientType) {
      case 'openai':
        return t('apiKeyIsSet');
      case 'gemini':
        return t('geminiApiKeyIsSet');
      case 'claude':
        return t('claudeApiKeyIsSet');
      default:
        return t('apiKeyIsSet');
    }
  };

  const getKeyNotSetText = () => {
    switch (modelClientType) {
      case 'openai':
        return t('apiKeyNotSet');
      case 'gemini':
        return t('geminiApiKeyNotSet');
      case 'claude':
        return t('claudeApiKeyNotSet');
      default:
        return t('apiKeyNotSet');
    }
  };

  const getStorageNotice = () => {
    switch (modelClientType) {
      case 'openai':
        return t('openaiKeyStorageNotice');
      case 'gemini':
        return t('geminiKeyStorageNotice');
      case 'claude':
        return t('claudeKeyStorageNotice');
      default:
        return t('keyStorageNotice');
    }
  };

  const getLinkText = () => {
    switch (modelClientType) {
      case 'openai':
        return t('getOpenAIKey');
      case 'gemini':
        return t('getGeminiKey');
      case 'claude':
        return t('getClaudeKey');
      default:
        return t('getApiKey');
    }
  };

  const currentEndpoint = getEndpoint(modelClientType);
  const isEndpointCustom = isCustomEndpoint(modelClientType);

  const handleEndpointSave = async (endpoint: string) => {
    await updateEndpoint(modelClientType, endpoint);
    if (onToast) onToast(t('endpointSavedSuccess'), 'success');
  };

  const handleEndpointReset = async () => {
    await resetEndpoint(modelClientType);
    if (onToast) onToast(t('resetToDefaultSuccess'), 'success');
  };

  if (!isAiEndpointLoaded) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">{getProviderTitle()}</h3>

      {/* API Endpoint Configuration */}
      <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="text-md font-medium mb-3">{t('endpointSettings')}</h4>
        <EndpointConfiguration
          modelClientType={modelClientType}
          currentEndpoint={currentEndpoint}
          isCustom={isEndpointCustom}
          onEndpointSave={handleEndpointSave}
          onEndpointReset={handleEndpointReset}
          onToast={onToast}
        />
      </div>

      {/* API Key Configuration */}
      <div className="border-l-4 border-green-500 pl-4">
        <h4 className="text-md font-medium mb-3">{t('apiKeySettings')}</h4>
        <TextInput
          label={getApiKeyLabel()}
          value={apiKey}
          placeholder="******"
          type="password"
          onSave={async key => {
            await onApiKeySave(key);
            if (onToast) onToast(getSuccessMessage(), 'success');
          }}
          onRemove={onApiKeyRemove}
          errorMessage={getErrorMessage()}
          successMessage={getSuccessMessage()}
          removeText={t('remove')}
          saveText={t('save')}
          savingText={t('saving')}
          keySetText={getKeySetText()}
          keyNotSetText={getKeyNotSetText()}
          getMaskedValue={getMaskedApiKey}
          onToast={onToast}
        />
      </div>

      {/* Model Configuration */}
      <div className="border-l-4 border-purple-500 pl-4">
        <h4 className="text-md font-medium mb-3">{t('modelSettings')}</h4>
        <ModelSelector
          modelClientType={modelClientType}
          currentModel={currentModel}
          onModelChange={onModelChange}
          onToast={onToast}
          htmlId={`${modelClientType}-model`}
        />
      </div>

      <div className="text-xs text-gray-500">
        <p>
          {getStorageNotice()}
          <a
            href={currentProvider?.tokenRegistrationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 ml-1">
            {getLinkText()}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyConfiguration;
