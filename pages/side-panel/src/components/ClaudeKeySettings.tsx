import { useClaudeKeyAtom } from '../hooks/useClaudeKeyAtom';
import { useClaudeModelAtom } from '../hooks/useClaudeModelAtom';
import { useI18n } from '@extension/i18n';
import TextInput from './common/TextInput';

interface ClaudeKeySettingsProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ClaudeKeySettings: React.FC<ClaudeKeySettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { claudeKey, setKeyAndStorage, clearKey } = useClaudeKeyAtom();
  const { claudeModel, setModelAndStorage } = useClaudeModelAtom();

  const validateClaudeKey = (key: string): boolean => {
    return key.startsWith('sk-');
  };

  const getMaskedApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="claude-settings">
      <TextInput
        label={t('claudeApiKey')}
        value={claudeKey}
        placeholder="sk-..."
        type="password"
        onSave={setKeyAndStorage}
        onRemove={clearKey}
        validator={validateClaudeKey}
        errorMessage={t('invalidClaudeApiKeyFormat')}
        successMessage={t('claudeApiKeySavedSuccess')}
        removeText={t('remove')}
        saveText={t('save')}
        savingText={t('saving')}
        keySetText={t('claudeApiKeyIsSet')}
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
          onChange={e => setModelAndStorage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="claude-3-sonnet-20240229">claude-3-sonnet-20240229</option>
          <option value="claude-3-opus-20240229">claude-3-opus-20240229</option>
        </select>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>{t('claudeKeyStorageNotice')}</p>
      </div>
    </div>
  );
};

export default ClaudeKeySettings;
