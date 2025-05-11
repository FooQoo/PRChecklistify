import { useState, useEffect } from 'react';
import { openaiApiKeyStorage } from '@extension/storage';

const OpenAIKeySettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the saved API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await openaiApiKeyStorage.get();
        setSavedKey(key);
        // マスク表示のためにプレースホルダーを設定
        if (key) {
          setApiKey(''); // 入力フィールドはクリアしておく
        }
      } catch (err) {
        console.error('Error loading OpenAI API key:', err);
        setError('Failed to load saved API key');
      }
    };

    loadApiKey();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);

    if (!apiKey.trim()) {
      setError('Please enter a valid OpenAI API key');
      return;
    }

    try {
      setIsLoading(true);

      // Basic validation - OpenAI API keys typically start with 'sk-'
      if (!apiKey.startsWith('sk-')) {
        setError('Invalid API key format. OpenAI API keys typically start with "sk-"');
        return;
      }

      // Save the API key to storage
      await openaiApiKeyStorage.set(apiKey);
      setSavedKey(apiKey);
      setApiKey(''); // Clear the input field
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving OpenAI API key:', err);
      setError('Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      await openaiApiKeyStorage.remove();
      setSavedKey(null);
      setApiKey('');
    } catch (err) {
      console.error('Error removing OpenAI API key:', err);
      setError('Failed to remove API key');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the masked display of the API key (show only first 4 and last 4 characters)
  const getMaskedApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="openai-settings">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
            OpenAI API Key
          </label>
          <div className="flex">
            <input
              type="password"
              id="openai-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={savedKey ? getMaskedApiKey(savedKey) : 'sk-...'}
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
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
          {savedKey && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">API key is set</span>
              <button type="button" onClick={handleRemoveKey} className="text-xs text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3 text-sm">{error}</div>
        )}
        {showSuccess && (
          <div className="p-2 bg-green-100 border border-green-300 text-green-800 rounded-md mb-3 text-sm">
            API key saved successfully!
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          <p>
            Your OpenAI API key is stored locally and only used to generate PR analysis.
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:text-blue-700 ml-1">
              Get your API key from OpenAI
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default OpenAIKeySettings;
