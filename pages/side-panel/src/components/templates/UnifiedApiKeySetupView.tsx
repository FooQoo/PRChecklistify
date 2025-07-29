import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';
import { useClaudeKeyAtom } from '@src/hooks/useClaudeKeyAtom';
import { useOpenaiModelAtom } from '@src/hooks/useOpenaiModelAtom';
import { useGeminiModelAtom } from '@src/hooks/useGeminiModelAtom';
import { useClaudeModelAtom } from '@src/hooks/useClaudeModelAtom';
import { useModelClientTypeAtom } from '@src/hooks/useModelClientTypeAtom';
import { isGeminiApiEnabled } from '@src/utils/envUtils';
import { Button, CenteredCard } from '@src/components/atoms';
import { ApiProviderSelector } from '@src/components/molecules';
import { ApiKeyConfiguration } from '@src/components/organisms';

import type { ModelClientType } from '@extension/storage';
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

  // プロバイダー選択時にストレージへ保存
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelClientType;
    await setTypeAndStorage(newProvider);
  };

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

  // API設定のpropsを取得
  const getApiConfigProps = () => {
    switch (modelClientType) {
      case 'openai':
        return {
          apiKey: openaiKey,
          currentModel: openaiModel,
          onApiKeySave: setOpenaiKeyAndStorage,
          onApiKeyRemove: clearOpenaiKey,
          onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => setOpenaiModelAndStorage(e.target.value),
        };
      case 'gemini':
        return {
          apiKey: geminiKey,
          currentModel: geminiModel,
          onApiKeySave: setGeminiKeyAndStorage,
          onApiKeyRemove: clearGeminiKey,
          onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => setGeminiModelAndStorage(e.target.value),
        };
      case 'claude':
        return {
          apiKey: claudeKey,
          currentModel: claudeModel,
          onApiKeySave: setClaudeKeyAndStorage,
          onApiKeyRemove: clearClaudeKey,
          onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => setClaudeModelAndStorage(e.target.value),
        };
      default:
        return {
          apiKey: undefined,
          currentModel: '',
          onApiKeySave: async () => {},
          onApiKeyRemove: async () => {},
          onModelChange: () => {},
        };
    }
  };

  const apiConfigProps = getApiConfigProps();

  // 設定画面の構造に合わせた統合レイアウト
  const renderContent = () => (
    <div className="space-y-4">
      <ApiProviderSelector
        modelClientType={modelClientType}
        onProviderChange={handleProviderChange}
        onToast={onToast}
      />

      {/* 選択されたプロバイダーの詳細設定 */}
      {modelClientType === 'gemini' && !geminiEnabled ? null : (
        <ApiKeyConfiguration modelClientType={modelClientType} {...apiConfigProps} onToast={onToast} />
      )}
    </div>
  );

  // セットアップモード用のレイアウト
  if (mode === 'setup') {
    return (
      <CenteredCard cardClassName="max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('apiKeySetup')}</h2>
        {renderContent()}
        <div className="mt-6 flex justify-end">
          <Button onClick={navigateToHome} variant="primary" disabled={!isApiKeySet()}>
            {t('next')}
          </Button>
        </div>
      </CenteredCard>
    );
  }

  // 設定モード用のレイアウト（設定画面内で使用）
  return renderContent();
};

export default UnifiedApiKeySetupView;
