import { useState, useEffect } from 'react';
import { openaiApiKeyStorage } from '@extension/storage';
import { openaiApiEndpointStorage } from '../services/openai';
import { t } from '@extension/i18n';

const OpenAIKeySettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [savedEndpoint, setSavedEndpoint] = useState<string | null>(null);

  // Load the saved API key on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load API key
        const key = await openaiApiKeyStorage.get();
        setSavedKey(key);
        // Set placeholder for masked display
        if (key) {
          setApiKey(''); // Clear input field
        }

        // Load API endpoint
        const endpoint = await openaiApiEndpointStorage.get();
        setSavedEndpoint(endpoint);
        if (endpoint) {
          setApiEndpoint(endpoint);
        }
      } catch (err) {
        console.error('Error loading OpenAI settings:', err);
        setError(t('failedToLoadSettings'));
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);

    if (!apiKey.trim()) {
      setError(t('pleaseEnterValidOpenAIKey'));
      return;
    }

    try {
      setIsLoading(true);

      // Basic validation - OpenAI API keys typically start with 'sk-'
      if (!apiKey.startsWith('sk-')) {
        setError(t('invalidApiKeyFormat'));
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
      setError(t('failedToSaveApiKey'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      await openaiApiKeyStorage.clear();
      setSavedKey(null);
      setApiKey('');
    } catch (err) {
      console.error('Error removing OpenAI API key:', err);
      setError(t('failedToRemoveApiKey'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndpointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);

    if (!apiEndpoint.trim()) {
      setError(t('pleaseEnterValidOpenAIEndpoint'));
      return;
    }

    try {
      setIsLoading(true);

      // Simple validation for URL format
      const url = new URL(apiEndpoint);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL format');
      }

      // Save the API endpoint to storage
      await openaiApiEndpointStorage.set(apiEndpoint);
      setSavedEndpoint(apiEndpoint);
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving OpenAI API endpoint:', err);
      setError(t('invalidUrlFormat'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetEndpoint = async () => {
    try {
      setIsLoading(true);
      await openaiApiEndpointStorage.clear();
      setSavedEndpoint(null);
      setApiEndpoint('');
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error resetting OpenAI API endpoint:', err);
      setError(t('failedToResetApiEndpoint'));
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
            {t('openaiApiKey')}
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
              {isLoading ? t('saving') : t('save')}
            </button>
          </div>
          {savedKey && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{t('apiKeyIsSet')}</span>
              <button type="button" onClick={handleRemoveKey} className="text-xs text-red-500 hover:text-red-700">
                {t('remove')}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-md mb-3 text-sm">{error}</div>
        )}
        {showSuccess && (
          <div className="p-2 bg-green-100 border border-green-300 text-green-800 rounded-md mb-3 text-sm">
            {t('apiKeySavedSuccess')}
          </div>
        )}

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

      {/* API Endpoint Settings */}
      <form onSubmit={handleEndpointSubmit} className="mb-4">
        <div className="mb-3">
          <label htmlFor="openai-endpoint" className="block text-sm font-medium text-gray-700 mb-1">
            {t('openaiApiEndpoint')}
          </label>
          <div className="flex">
            <input
              type="text"
              id="openai-endpoint"
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !apiEndpoint.trim()}
              className={`px-4 py-2 ${
                isLoading || !apiEndpoint.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {isLoading ? t('saving') : t('save')}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {savedEndpoint ? t('currentEndpoint', [savedEndpoint]) : t('usingDefaultEndpoint')}
            </span>
            {savedEndpoint && (
              <button type="button" onClick={handleResetEndpoint} className="text-xs text-red-500 hover:text-red-700">
                {t('resetToDefault')}
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          <p>{t('setCustomEndpointNotice')}</p>
        </div>
      </form>
    </div>
  );
};

export default OpenAIKeySettings;
