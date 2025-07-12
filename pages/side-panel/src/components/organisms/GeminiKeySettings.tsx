import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';
import { useGeminiModelAtom } from '@src/hooks/useGeminiModelAtom';
import { useI18n } from '@extension/i18n';
import { TextInput } from '../atoms';
import { getGeminiModelOptions } from '@extension/storage';

interface GeminiKeySettingsProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const GeminiKeySettings: React.FC<GeminiKeySettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { geminiKey, setKeyAndStorage, clearKey } = useGeminiKeyAtom();
  const { geminiModel, setModelAndStorage } = useGeminiModelAtom();
  const modelOptions = getGeminiModelOptions();

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

      <div className="mb-4">
        <label htmlFor="gemini-model" className="block text-sm font-medium text-gray-700 mb-1">
          {t('modelVersion')}
        </label>
        <select
          id="gemini-model"
          value={geminiModel}
          onChange={e => setModelAndStorage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          {modelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>{t('geminiKeyStorageNotice')}</p>
      </div>
    </div>
  );
};

export default GeminiKeySettings;
