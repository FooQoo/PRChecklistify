import { useEffect, useState } from 'react';
import { githubTokenStorage } from '@extension/storage';

// Component for GitHub token settings
const GitHubTokenSettings = () => {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load the saved token when component mounts
  useEffect(() => {
    const loadToken = async () => {
      const token = await githubTokenStorage.get();
      setSavedToken(token);
    };
    loadToken();
  }, []);

  const handleSaveToken = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      await githubTokenStorage.set(token);
      setSavedToken(token);
      setMessage({ text: 'Token saved successfully', type: 'success' });

      // Clear the input after successful save
      setToken('');
    } catch (error) {
      console.error('Error saving token:', error);
      setMessage({ text: 'Failed to save token', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearToken = async () => {
    try {
      setIsSaving(true);
      await githubTokenStorage.clear();
      setSavedToken('');
      setMessage({ text: 'Token cleared successfully', type: 'success' });
    } catch (error) {
      console.error('Error clearing token:', error);
      setMessage({ text: 'Failed to clear token', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded p-4 w-full mt-4">
      <h3 className="text-lg font-bold mb-3">GitHub Token Settings</h3>
      <div className="mb-4">
        <p className="text-sm mb-2">
          {savedToken
            ? 'GitHub token is set. You can update or clear it below.'
            : 'Set your GitHub Personal Access Token to improve API rate limits and access private repositories.'}
        </p>

        {savedToken && (
          <div className="flex items-center mb-3">
            <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded flex-grow mr-2 font-mono">
              {showToken ? savedToken : '•'.repeat(Math.min(savedToken.length, 24))}
            </div>
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-xs bg-gray-200 hover:bg-gray-300 p-1 rounded">
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
        )}

        <div className="flex">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter GitHub PAT..."
            className="flex-grow p-2 border rounded-l text-sm"
          />
          <button
            onClick={handleSaveToken}
            disabled={isSaving || !token}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-r text-sm disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {savedToken && (
          <button
            onClick={handleClearToken}
            disabled={isSaving}
            className="text-xs text-red-500 hover:text-red-600 mt-2">
            Clear token
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

export default GitHubTokenSettings;
