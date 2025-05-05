import { useState } from 'react';
import { githubTokenStorage } from '@extension/storage';

// Component for GitHub token setup prompt
const TokenSetupPrompt = ({ onComplete }: { onComplete: () => void }) => {
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSaveToken = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      await githubTokenStorage.set(token);
      setMessage({ text: 'Token saved successfully', type: 'success' });

      // Wait a moment to show success message before proceeding
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error saving token:', error);
      setMessage({ text: 'Failed to save token', type: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">GitHub Token Required</h2>

        <p className="text-sm mb-4">
          A GitHub Personal Access Token (PAT) is required to access PR data. This helps with API rate limits and allows
          access to private repositories.
        </p>

        <div className="mb-4 border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 text-xs">
          <p className="mb-1 font-semibold">How to create a GitHub PAT:</p>
          <ol className="list-decimal ml-4">
            <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
            <li>
              Generate a new token with at least <code>repo</code> scope
            </li>
            <li>Copy and paste the token below</li>
          </ol>
        </div>

        <div className="mb-4">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter GitHub PAT..."
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSaveToken}
            disabled={isSaving || !token}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 flex-grow">
            {isSaving ? 'Saving...' : 'Save Token'}
          </button>
        </div>

        {message.text && (
          <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default TokenSetupPrompt;
