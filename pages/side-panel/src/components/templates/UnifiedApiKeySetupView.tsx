import { useMemo } from 'react';
import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '../../hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '../../hooks/useGeminiKeyAtom';
import { useClaudeKeyAtom } from '../../hooks/useClaudeKeyAtom';
import { useOpenaiModelAtom } from '../../hooks/useOpenaiModelAtom';
import { useGeminiModelAtom } from '../../hooks/useGeminiModelAtom';
import { useClaudeModelAtom } from '../../hooks/useClaudeModelAtom';
import { useModelClientTypeAtom } from '../../hooks/useModelClientTypeAtom';
import { isGeminiApiEnabled } from '../../utils/envUtils';
import { TextInput, Button } from '../atoms';
import { getAllLLMProviders, getLLMProviderById } from '../../services/configLoader';

import type { ModelClientType } from '../../services/modelClient';
import { useNavigation } from '@src/views/NavigationContext';

interface UnifiedApiKeySetupViewProps {
  mode?: 'setup' | 'settings';
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const UnifiedApiKeySetupView: React.FC<UnifiedApiKeySetupViewProps> = ({ mode = 'setup', onToast }) => {
  const { t } = useI18n();
  const { navigateToHome } = useNavigation();
  const { openaiKey, setKeyAndStorage: setOpenaiKeyAndStorage, clearKey: clearOpenaiKey } = useOpenaiKeyAtom();
  const { geminiKey, setKeyAndStorage: setGeminiKeyAndStorage, clearKey: clearGeminiKey } = useGeminiKeyAtom();
  const { claudeKey, setKeyAndStorage: setClaudeKeyAndStorage, clearKey: clearClaudeKey } = useClaudeKeyAtom();
  const { openaiModel, setModelAndStorage: setOpenaiModelAndStorage } = useOpenaiModelAtom();
  const { geminiModel, setModelAndStorage: setGeminiModelAndStorage } = useGeminiModelAtom();
  const { claudeModel, setModelAndStorage: setClaudeModelAndStorage } = useClaudeModelAtom();
  const { modelClientType, setTypeAndStorage } = useModelClientTypeAtom();

  const geminiEnabled = isGeminiApiEnabled();
  const llmProviders = getAllLLMProviders();

  // 現在のプロバイダー情報をメモ化
  const currentProvider = useMemo(() => {
    if (modelClientType && llmProviders.length > 0) {
      return getLLMProviderById(modelClientType) || null;
    }
    return null;
  }, [modelClientType, llmProviders]);

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

  // プロバイダー選択時にストレージへ保存
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelClientType;
    await setTypeAndStorage(newProvider);
  };

  // APIキーのマスク表示
  const getMaskedApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  // プロバイダーオプションをJSONから取得
  const getProviderOptions = () => {
    return llmProviders
      .filter(provider => provider.id !== 'gemini' || geminiEnabled)
      .map(provider => ({
        id: provider.id,
        name: provider.name,
      }));
  };

  const providerOptions = getProviderOptions();

  // 現在のプロバイダーのAPIキーが設定されているかどうかを確認
  const isApiKeySet = () => {
    switch (modelClientType) {
      case 'openai':
        return !!openaiKey;
      case 'gemini':
        return !!geminiKey;
      case 'claude':
        return !!claudeKey;
      default:
        return false;
    }
  };

  // 設定画面の構造に合わせた統合レイアウト
  const renderContent = () => (
    <div className="space-y-4">
      {/* プロバイダー選択 */}
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

      {/* 選択されたプロバイダーの詳細設定 */}
      {modelClientType === 'openai' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t('openaiIntegration')}</h3>
          <TextInput
            label={t('openaiApiKey')}
            value={openaiKey}
            placeholder="******"
            type="password"
            onSave={async key => {
              await setOpenaiKeyAndStorage(key);
              if (onToast) onToast(t('apiKeySavedSuccess'), 'success');
            }}
            onRemove={clearOpenaiKey}
            errorMessage={t('invalidApiKeyFormat')}
            successMessage={t('apiKeySavedSuccess')}
            removeText={t('remove')}
            saveText={t('save')}
            savingText={t('saving')}
            keySetText={t('apiKeyIsSet')}
            keyNotSetText={t('apiKeyNotSet')}
            getMaskedValue={getMaskedApiKey}
            onToast={onToast}
          />
          <div className="mb-4">
            <label htmlFor="openai-model" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modelVersion')}
            </label>
            <select
              id="openai-model"
              value={openaiModel}
              onChange={e => setOpenaiModelAndStorage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {getUnifiedModelOptions('openai' as ModelClientType).map(model => (
                <option key={model.key} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            <p>
              {t('openaiKeyStorageNotice')}
              <a
                href={currentProvider?.tokenRegistrationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-700 ml-1">
                {t('getOpenAIKey')}
              </a>
            </p>
          </div>
        </div>
      )}

      {modelClientType === 'gemini' && geminiEnabled && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t('geminiIntegration')}</h3>
          <TextInput
            label={t('geminiApiKey')}
            value={geminiKey}
            placeholder="******"
            type="password"
            onSave={async key => {
              await setGeminiKeyAndStorage(key);
              if (onToast) onToast(t('geminiApiKeySavedSuccess'), 'success');
            }}
            onRemove={clearGeminiKey}
            errorMessage={t('invalidGeminiApiKeyFormat')}
            successMessage={t('geminiApiKeySavedSuccess')}
            removeText={t('remove')}
            saveText={t('save')}
            savingText={t('saving')}
            keySetText={t('geminiApiKeyIsSet')}
            keyNotSetText={t('geminiApiKeyNotSet')}
            getMaskedValue={getMaskedApiKey}
            onToast={onToast}
          />
          <div className="mb-4">
            <label htmlFor="gemini-model" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modelVersion')}
            </label>
            <select
              id="gemini-model"
              value={geminiModel}
              onChange={e => setGeminiModelAndStorage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {getUnifiedModelOptions('gemini' as ModelClientType).map(model => (
                <option key={model.key} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            <p>
              {t('geminiKeyStorageNotice')}
              <a
                href={currentProvider?.tokenRegistrationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-700 ml-1">
                {t('getGeminiKey')}
              </a>
            </p>
          </div>
        </div>
      )}

      {modelClientType === 'claude' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t('claudeIntegration')}</h3>
          <TextInput
            label={t('claudeApiKey')}
            value={claudeKey}
            placeholder="******"
            type="password"
            onSave={async key => {
              await setClaudeKeyAndStorage(key);
              if (onToast) onToast(t('claudeApiKeySavedSuccess'), 'success');
            }}
            onRemove={clearClaudeKey}
            errorMessage={t('invalidClaudeApiKeyFormat')}
            successMessage={t('claudeApiKeySavedSuccess')}
            removeText={t('remove')}
            saveText={t('save')}
            savingText={t('saving')}
            keySetText={t('claudeApiKeyIsSet')}
            keyNotSetText={t('claudeApiKeyNotSet')}
            getMaskedValue={getMaskedApiKey}
            onToast={onToast}
          />
          <div className="mb-4">
            <label htmlFor="claude-model" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modelVersion')}
            </label>
            <select
              id="claude-model"
              value={claudeModel}
              onChange={e => setClaudeModelAndStorage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {getUnifiedModelOptions('claude' as ModelClientType).map(model => (
                <option key={model.key} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            <p>
              {t('claudeKeyStorageNotice')}
              <a
                href={currentProvider?.tokenRegistrationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-700 ml-1">
                {t('getClaudeKey')}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // セットアップモード用のレイアウト
  if (mode === 'setup') {
    return (
      <div className="flex items-center justify-center h-screen p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">{t('apiKeySetup')}</h2>
          {renderContent()}
          <div className="mt-6 flex justify-end">
            <Button onClick={navigateToHome} variant="primary" disabled={!isApiKeySet()}>
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 設定モード用のレイアウト（設定画面内で使用）
  return renderContent();
};

export default UnifiedApiKeySetupView;
