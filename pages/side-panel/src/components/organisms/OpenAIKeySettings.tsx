import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '../../hooks/useOpenaiKeyAtom';
import { useOpenaiModelAtom } from '../../hooks/useOpenaiModelAtom';
import { TextInput } from '../atoms';
import { getOpenAIModelOptions } from '@extension/storage';

type OpenAIKeySettingsProps = {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

const OpenAIKeySettings: React.FC<OpenAIKeySettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { openaiKey, setKeyAndStorage, clearKey } = useOpenaiKeyAtom();
  const { openaiModel, setModelAndStorage } = useOpenaiModelAtom();
  const modelOptions = getOpenAIModelOptions();

  // OpenAI APIキーのバリデーション
  const validateOpenAIKey = (key: string): boolean => {
    return key.startsWith('sk-');
  };

  // APIキーのマスク表示
  const getMaskedApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="openai-settings">
      <TextInput
        label={t('openaiApiKey')}
        value={openaiKey}
        placeholder="sk-..."
        type="password"
        onSave={setKeyAndStorage}
        onRemove={clearKey}
        validator={validateOpenAIKey}
        errorMessage={t('invalidApiKeyFormat')}
        successMessage={t('apiKeySavedSuccess')}
        removeText={t('remove')}
        saveText={t('save')}
        savingText={t('saving')}
        keySetText={t('apiKeyIsSet')}
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
        <p>
          {t('openaiKeyStorageNotice')}
          <a
            href="https://platform.openai.com/account/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 ml-1">
            {t('getOpenAIKey')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default OpenAIKeySettings;
