import { useState } from 'react';
import { useI18n } from '@extension/i18n';
import { useClaudeKeyAtom } from '../hooks/useClaudeKeyAtom';
import { useClaudeModelAtom } from '../hooks/useClaudeModelAtom';

interface ClaudeKeySettingsProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ClaudeKeySettings: React.FC<ClaudeKeySettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { claudeKey, setKeyAndStorage, clearKey } = useClaudeKeyAtom();
  const { claudeModel, setModelAndStorage } = useClaudeModelAtom();

  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      onToast(t('pleaseEnterValidClaudeApiKey'), 'error');
      return;
    }
    try {
      setIsLoading(true);
      await setKeyAndStorage(apiKey);
      setApiKey('');
      onToast(t('claudeApiKeySavedSuccess'), 'success');
    } catch {
      onToast(t('failedToSaveClaudeApiKey'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      await clearKey();
      setApiKey('');
      onToast(t('claudeApiKeyCleared'), 'success');
    } catch {
      onToast(t('failedToClearClaudeApiKey'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getMaskedApiKey = (key: string | undefined): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="claude-settings">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <label htmlFor="claude-key" className="block text-sm font-medium text-gray-700 mb-1">
            {t('claudeApiKey')}
          </label>
          <div className="flex">
            <input
              type="password"
              id="claude-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={claudeKey ? getMaskedApiKey(claudeKey) : t('enterClaudeApiKey')}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:z-10 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className={`px-4 py-2 ${
                isLoading || !apiKey.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {t('save')}
            </button>
          </div>
        </div>
        {claudeKey && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">{t('claudeApiKeyIsSet')}</span>
            <button
              type="button"
              onClick={handleRemoveKey}
              className="text-xs text-red-500 hover:text-red-700"
              disabled={isLoading}>
              {t('remove')}
            </button>
          </div>
        )}
        <div className="mt-4">
          <label htmlFor="claude-model" className="block text-sm font-medium text-gray-700 mb-1">
            {t('modelVersion')}
          </label>
          <select
            id="claude-model"
            value={claudeModel}
            onChange={e => setModelAndStorage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="claude-3-opus-20240229">claude-3-opus-20240229</option>
            <option value="claude-3-sonnet-20240229">claude-3-sonnet-20240229</option>
          </select>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <p>{t('claudeKeyStorageNotice')}</p>
        </div>
      </form>
    </div>
  );
};

export default ClaudeKeySettings;
