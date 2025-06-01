import { useState } from 'react';

interface GeminiKeySettingsProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const GeminiKeySettings: React.FC<GeminiKeySettingsProps> = ({ onToast }) => {
  // Gemini APIキーの状態
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      onToast('Please enter a valid Gemini API key', 'error');
      return;
    }
    try {
      setIsLoading(true);
      await chrome.storage.local.set({ geminiApiKey: apiKey });
      setApiKey('');
      onToast('Gemini API key saved', 'success');
    } catch {
      onToast('Failed to save Gemini API key', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 削除処理
  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      await chrome.storage.local.remove('geminiApiKey');
      setApiKey('');
      onToast('Gemini API key cleared', 'success');
    } catch {
      onToast('Failed to clear Gemini API key', 'error');
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
            Gemini API Key
          </label>
          <div className="flex">
            <input
              type="password"
              id="gemini-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={getMaskedApiKey(apiKey)}
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
              Save
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <p>Store your Gemini API key securely. It is only saved in your browser.</p>
        </div>
      </form>
      <button
        type="button"
        onClick={handleRemoveKey}
        disabled={isLoading}
        className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400">
        Remove Key
      </button>
    </div>
  );
};

export default GeminiKeySettings;
