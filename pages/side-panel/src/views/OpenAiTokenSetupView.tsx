import { useNavigation } from '../context/NavigationContext';
import { useI18n } from '@extension/i18n';
import { useState, useEffect } from 'react';
import { useOpenaiKeyAtom } from '../hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';
import { useClaudeKeyAtom } from '../hooks/useClaudeKeyAtom';
import { useModelClientTypeAtom } from '../hooks/useModelClientTypeAtom';
import { isGeminiApiEnabled } from '../utils/envUtils';

const OpenAiTokenSetupView: React.FC = () => {
  const { t } = useI18n();
  const { navigateToHome } = useNavigation();
  const { openaiKey, setKeyAndStorage } = useOpenaiKeyAtom();
  const { geminiKey, setKeyAndStorage: setGeminiKeyAndStorage } = useGeminiKeyAtom();
  const { claudeKey, setKeyAndStorage: setClaudeKeyAndStorage } = useClaudeKeyAtom();
  const { modelClientType, setTypeAndStorage } = useModelClientTypeAtom();
  const [provider, setProvider] = useState(modelClientType);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geminiEnabled = isGeminiApiEnabled();

  const PROVIDERS = [
    {
      id: 'openai',
      name: 'OpenAI',
      placeholder: 'sk-...',
      link: 'https://platform.openai.com/account/api-keys',
      linkText: 'Get your OpenAI API key →',
      validate: (key: string) => key.trim().length > 0,
      invalidMsg: t('invalidApiKeyFormat'),
      desc: t('openaiApiDesc'),
    },
    {
      id: 'claude',
      name: 'Claude',
      placeholder: 'sk-...',
      link: 'https://console.anthropic.com/account/keys',
      linkText: 'Get your Claude API key →',
      validate: (key: string) => key.trim().length > 0,
      invalidMsg: 'Invalid Claude API Key',
      desc: t('claudeDesc'),
    },
  ];

  // プロバイダー初期値をストレージから取得
  useEffect(() => {
    setProvider(modelClientType);
  }, [modelClientType]);

  // プロバイダー選択時にストレージへ保存
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as typeof modelClientType;
    setProvider(newProvider);
    await setTypeAndStorage(newProvider);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const currentProvider = providerOptions.find(p => p.id === provider)!;
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
      } else if (provider === 'claude') {
        await setClaudeKeyAndStorage(apiKey);
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

  // プロバイダーリストを動的に生成
  const providerOptions = [
    PROVIDERS[0],
    PROVIDERS[1],
    ...(geminiEnabled
      ? [
          {
            id: 'gemini',
            name: 'Gemini',
            placeholder: 'AIza...',
            link: 'https://aistudio.google.com/app/apikey',
            linkText: 'Get your Gemini API key →',
            validate: (key: string) => key.trim().length > 10 && key.startsWith('AIza'),
            invalidMsg: 'Invalid Gemini API Key',
            desc: t('geminiDesc'),
          },
        ]
      : []),
  ];
  const currentProvider = providerOptions.find(p => p.id === provider)!;

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
            onChange={handleProviderChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
            {providerOptions.map(p => (
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
                    : provider === 'claude' && claudeKey
                      ? getMaskedApiKey(claudeKey)
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
              {isLoading ? t('verifying') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenAiTokenSetupView;
