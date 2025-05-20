import { useNavigation } from '../context/NavigationContext';
import { t } from '@extension/i18n';
import { useState } from 'react';
import { useOpenaiKeyAtom } from '../hooks/useOpenaiKeyAtom';

const OpenAiTokenSetupView: React.FC = () => {
  const { navigateToHome } = useNavigation();
  const { openaiKey, setKeyAndStorage } = useOpenaiKeyAtom();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!apiKey.trim() || !apiKey.startsWith('sk-')) {
      setError(t('invalidApiKeyFormat'));
      return;
    }
    try {
      setIsLoading(true);
      await setKeyAndStorage(apiKey);
      setApiKey('');
    } catch {
      setError('Failed to save');
    } finally {
      setIsLoading(false);
      navigateToHome();
    }
  };

  // マスク表示
  const getMaskedApiKey = (key: string | undefined): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="flex items-center justify-center h-screen p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">OpenAI API Key Setup</h2>
        <p className="text-sm mb-4">To use PR Checklistify, you need to provide your OpenAI API key.</p>
        <div className="mb-4">
          <a
            href="https://platform.openai.com/account/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm">
            Get your OpenAI API key →
          </a>
        </div>
        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="openai-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={openaiKey ? getMaskedApiKey(openaiKey) : 'sk-...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}>
              {isLoading ? 'Verifying...' : 'Save Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenAiTokenSetupView;
