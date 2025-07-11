import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';
import { useState } from 'react';
import { t } from '@extension/i18n';

interface GeminiKeySettingsProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const GeminiKeySettings: React.FC<GeminiKeySettingsProps> = ({ onToast }) => {
  const { geminiKey, setKeyAndStorage, clearKey } = useGeminiKeyAtom();

  // Gemini APIキーの状態
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      onToast(t('pleaseEnterValidGeminiApiKey'), 'error');
      return;
    }
    try {
      setIsLoading(true);
      if (!apiKey.startsWith('AIza')) {
        onToast(t('invalidGeminiApiKeyFormat'), 'error');
        return;
      }
      await setKeyAndStorage(apiKey);
      setApiKey('');
      onToast(t('geminiApiKeySavedSuccess'), 'success');
    } catch {
      onToast(t('failedToSaveGeminiApiKey'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 削除処理
  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      await clearKey();
      setApiKey('');
      onToast(t('geminiApiKeyCleared'), 'success');
    } catch {
      onToast(t('failedToClearGeminiApiKey'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // マスク表示（10文字未満は****）
  const getMaskedApiKey = (key: string | undefined): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="gemini-settings">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700 mb-1">
            {t('geminiApiKey')}
          </label>
          <div className="flex">
            <input
              type="password"
              id="gemini-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={geminiKey ? getMaskedApiKey(geminiKey) : t('enterGeminiApiKey')}
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
              {t('save')}
            </button>
          </div>
        </div>
        {geminiKey && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">{t('geminiApiKeyIsSet')}</span>
            <button
              type="button"
              onClick={handleRemoveKey}
              className="text-xs text-red-500 hover:text-red-700"
              disabled={isLoading}>
              {t('remove')}
            </button>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          <p>{t('geminiKeyStorageNotice')}</p>
        </div>
      </form>
    </div>
  );
};

export default GeminiKeySettings;
