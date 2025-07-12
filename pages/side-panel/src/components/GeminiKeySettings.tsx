import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';
import { useI18n } from '@extension/i18n';
import TextInput from './common/TextInput';

interface GeminiKeySettingsProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const GeminiKeySettings: React.FC<GeminiKeySettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { geminiKey, setKeyAndStorage, clearKey } = useGeminiKeyAtom();

  // Gemini APIキーのバリデーション
  const validateGeminiKey = (key: string): boolean => {
    return key.startsWith('AIza');
  };

  // APIキーのマスク表示
  const getMaskedApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="gemini-settings">
      <TextInput
        label={t('geminiApiKey')}
        value={geminiKey}
        placeholder={t('enterGeminiApiKey')}
        type="password"
        onSave={setKeyAndStorage}
        onRemove={clearKey}
        validator={validateGeminiKey}
        errorMessage={t('invalidGeminiApiKeyFormat')}
        successMessage={t('geminiApiKeySavedSuccess')}
        removeText={t('remove')}
        saveText={t('save')}
        savingText={t('saving')}
        keySetText={t('geminiApiKeyIsSet')}
        getMaskedValue={getMaskedApiKey}
        onToast={onToast}
      />

      <div className="text-xs text-gray-500 mt-2">
        <p>{t('geminiKeyStorageNotice')}</p>
      </div>
    </div>
  );
};

export default GeminiKeySettings;
