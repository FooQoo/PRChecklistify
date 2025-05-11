import { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import OpenAIKeySettings from '../components/OpenAIKeySettings';
import { githubTokenStorage, languagePreferenceStorage } from '@extension/storage';
import { extractPRInfo } from '../utils/prUtils';

const SettingsView: React.FC = () => {
  const { navigateToHome, navigateToPR } = useNavigation();
  const [githubToken, setGithubToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [recentPRs, setRecentPRs] = useState<{ url: string; title: string; timestamp: number }[]>([]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load GitHub token
        const token = await githubTokenStorage.get();
        setHasToken(!!token);

        // Load language preference
        const savedLanguage = await languagePreferenceStorage.get();
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }

        // Load recent PRs
        const result = await chrome.storage.local.get('recentPRs');
        if (result.recentPRs && Array.isArray(result.recentPRs)) {
          const sortedPRs = [...result.recentPRs].sort((a, b) => b.timestamp - a.timestamp);
          setRecentPRs(sortedPRs);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      }
    };

    loadSettings();
  }, []);

  const handleGitHubTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);

    if (!githubToken.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    try {
      setIsLoading(true);

      // Verify the token works by making a test API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      });

      if (response.ok) {
        // Save the token only if it's verified
        await githubTokenStorage.set(githubToken);
        setGithubToken(''); // Clear the input field
        setHasToken(true);
        setShowSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        setError(`Invalid token: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Token verification error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveToken = async () => {
    try {
      setIsLoading(true);
      await githubTokenStorage.clear();
      setHasToken(false);
      setGithubToken('');
    } catch (err) {
      console.error('Error removing GitHub token:', err);
      setError('Failed to remove token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);

    try {
      await languagePreferenceStorage.set(newLanguage);
    } catch (err) {
      console.error('Error saving language preference:', err);
      setError('Failed to save language preference');
    }
  };

  // PR navigation handler
  const handlePRClick = (url: string) => {
    const prInfo = extractPRInfo(url);
    if (prInfo) {
      const { owner, repo, prNumber } = prInfo;
      navigateToPR(owner, repo, prNumber);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Settings</h1>
          <button onClick={navigateToHome} className="text-blue-500 hover:text-blue-700 text-sm flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">GitHub Integration</h2>

          {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">{error}</div>}
          {showSuccess && (
            <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-md mb-4">
              GitHub token saved successfully!
            </div>
          )}

          <form onSubmit={handleGitHubTokenSubmit} className="mb-4">
            <div className="mb-4">
              <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Personal Access Token
              </label>
              <div className="flex">
                <input
                  type="password"
                  id="github-token"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder={hasToken ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !githubToken.trim()}
                  className={`px-4 py-2 ${
                    isLoading || !githubToken.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } rounded-r-md`}>
                  {isLoading ? 'Verifying...' : 'Save'}
                </button>
              </div>
              {hasToken && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Token is set</span>
                  <button type="button" onClick={handleRemoveToken} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              <p>
                Your GitHub token is stored locally and only used to access PR data.
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=PR+Checklistify+Extension"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-700 ml-1">
                  Create a new token on GitHub →
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">OpenAI Integration</h2>
          <OpenAIKeySettings />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Recent Pull Requests</h2>
          {recentPRs.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Select a PR to view its details and analysis. You can view any PR from this list, even when not on a PR
                page.
              </p>
              <ul className="divide-y divide-gray-200">
                {recentPRs.map((pr, index) => (
                  <li key={index} className="py-2">
                    <button
                      onClick={() => handlePRClick(pr.url)}
                      className="w-full text-left hover:bg-gray-50 p-2 rounded">
                      <div className="text-sm font-medium text-blue-600 truncate">{pr.title}</div>
                      <div className="text-xs text-gray-500 truncate">{pr.url}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(pr.timestamp).toLocaleString()}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent PRs found. Visit a GitHub PR to add it to this list.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>

          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Analysis Language
            </label>
            <select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the language for AI-generated PR analysis and checklist items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
