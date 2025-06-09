import { useState } from 'react';
import { t } from '@extension/i18n';
import { useOpenaiKeyAtom } from '../hooks/useOpenaiKeyAtom';

// props
interface OpenAIKeySettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const OpenAIKeySettings = ({ onToast }: OpenAIKeySettingsProps) => {
  // useOpenaiKeyAtomでOpenAIキーを管理
  const { openaiKey, setKeyAndStorage, clearKey } = useOpenaiKeyAtom();

  // APIキー入力関連のstate
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      onToast(t('invalidApiKeyFormat'), 'error');
      return;
    }
    try {
      setIsLoading(true);
      if (!apiKey.startsWith('sk-')) {
        onToast(t('invalidApiKeyFormat'), 'error');
        return;
      }
      await setKeyAndStorage(apiKey);
      setApiKey('');
      onToast(t('apiKeySavedSuccess'), 'success');
    } catch (err) {
      console.error('Error saving OpenAI API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      await clearKey();
      setApiKey('');
      onToast(t('remove'), 'success');
    } catch (err) {
      console.error('Error removing OpenAI API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the masked display of the API key (show only first 4 and last 4 characters)
  const getMaskedApiKey = (key: string | undefined): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="openai-settings">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
            {t('openaiApiKey')}
          </label>
          <div className="flex">
            <input
              type="password"
              id="openai-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={openaiKey ? getMaskedApiKey(openaiKey) : 'sk-...'}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className={`px-4 py-2 ${
                isLoading || !apiKey.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {isLoading ? t('saving') : t('save')}
            </button>
          </div>
          {openaiKey && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{t('apiKeyIsSet')}</span>
              <button type="button" onClick={handleRemoveKey} className="text-xs text-red-500 hover:text-red-700">
                {t('remove')}
              </button>
            </div>
          )}
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
      </form>
    </div>
  );
};

export default OpenAIKeySettings;
