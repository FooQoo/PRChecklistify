import { useNavigation } from '../context/NavigationContext';
import { t } from '@extension/i18n';
import { useState } from 'react';
import { useOpenaiKeyAtom } from '../hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
    link: 'https://platform.openai.com/account/api-keys',
    linkText: 'Get your OpenAI API key →',
    validate: (key: string) => key.trim().startsWith('sk-'),
    invalidMsg: t('invalidApiKeyFormat'),
    desc: 'To use PR Checklistify, you need to provide your OpenAI API key.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    placeholder: 'AIza...',
    link: 'https://aistudio.google.com/app/apikey',
    linkText: 'Get your Gemini API key →',
    validate: (key: string) => key.trim().length > 10 && key.startsWith('AIza'),
    invalidMsg: 'Invalid Gemini API Key',
    desc: 'To use PR Checklistify with Gemini, provide your Gemini API key.',
  },
];

const OpenAiTokenSetupView: React.FC = () => {
  const { navigateToHome } = useNavigation();
  const { openaiKey, setKeyAndStorage } = useOpenaiKeyAtom();
  const { geminiKey, setKeyAndStorage: setGeminiKeyAndStorage } = useGeminiKeyAtom();
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProvider = PROVIDERS.find(p => p.id === provider)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentProvider.validate(apiKey)) {
      setError(currentProvider.invalidMsg);
      return;
    }
    try {
      setIsLoading(true);
      if (provider === 'openai') {
        await setKeyAndStorage(apiKey);
      } else if (provider === 'gemini') {
        await setGeminiKeyAndStorage(apiKey);
      }
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
        <h2 className="text-xl font-bold mb-4">API Key Setup</h2>
        <div className="mb-4">
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
            Model Provider
          </label>
          <select
            id="provider"
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
            {PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm mb-4">{currentProvider.desc}</p>
        <div className="mb-4">
          <a
            href={currentProvider.link}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm">
            {currentProvider.linkText}
          </a>
        </div>
        {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
              {currentProvider.name} API Key
            </label>
            <input
              type="password"
              id="api-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={
                provider === 'openai' && openaiKey
                  ? getMaskedApiKey(openaiKey)
                  : provider === 'gemini' && geminiKey
                    ? getMaskedApiKey(geminiKey)
                    : currentProvider.placeholder
              }
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
