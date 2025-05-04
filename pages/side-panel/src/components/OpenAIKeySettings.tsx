import { useState, useEffect } from 'react';
import { openaiApiKeyStorage } from '@extension/storage';

/**
 * Component for OpenAI API Key settings
 * Allows users to set, view, and manage their OpenAI API key
 */
const OpenAIKeySettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load the saved API key when component mounts
  useEffect(() => {
    const loadApiKey = async () => {
      const key = await openaiApiKeyStorage.get();
      if (key) {
        setSavedApiKey(key);
      }
    };
    loadApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      await openaiApiKeyStorage.set(apiKey);
      setSavedApiKey(apiKey);
      setMessage({ text: 'API key saved successfully', type: 'success' });

      // Clear the input after successful save
      setApiKey('');
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ text: 'Failed to save API key', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = async () => {
    try {
      setIsSaving(true);
      await openaiApiKeyStorage.clear();
      setSavedApiKey('');
      setMessage({ text: 'API key cleared successfully', type: 'success' });
    } catch (error) {
      console.error('Error clearing API key:', error);
      setMessage({ text: 'Failed to clear API key', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded p-4 w-full mt-4">
      <h3 className="text-lg font-bold mb-3">OpenAI API Key Settings</h3>
      <div className="mb-4">
        <p className="text-sm mb-2">
          {savedApiKey
            ? 'OpenAI API key is set. You can update or clear it below.'
            : 'Set your OpenAI API key to generate PR checklists and summaries using AI.'}
        </p>

        {savedApiKey && (
          <div className="flex items-center mb-3">
            <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded flex-grow mr-2 font-mono">
              {showApiKey ? savedApiKey : '•'.repeat(Math.min(savedApiKey.length, 24))}
            </div>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-xs bg-gray-200 hover:bg-gray-300 p-1 rounded">
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        )}

        <div className="flex">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter OpenAI API Key..."
            className="flex-grow p-2 border rounded-l text-sm"
          />
          <button
            onClick={handleSaveApiKey}
            disabled={isSaving || !apiKey}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-r text-sm disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {savedApiKey && (
          <button
            onClick={handleClearApiKey}
            disabled={isSaving}
            className="text-xs text-red-500 hover:text-red-600 mt-2">
            Clear API key
          </button>
        )}

        {message.text && (
          <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default OpenAIKeySettings;
