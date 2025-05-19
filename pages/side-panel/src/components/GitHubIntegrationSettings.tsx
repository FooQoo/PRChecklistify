import { useState, useEffect } from 'react';
import { githubTokenStorage, githubApiDomainStorage } from '@extension/storage';
import { t } from '@extension/i18n';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const [githubToken, setGithubToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubApiDomain, setGithubApiDomain] = useState('https://api.github.com');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load GitHub token
        const token = await githubTokenStorage.get();
        setHasToken(!!token);

        // Load GitHub API domain
        const apiDomain = await githubApiDomainStorage.get();
        setGithubApiDomain(apiDomain || 'https://api.github.com');
      } catch (err) {
        console.error('Error loading GitHub settings:', err);
        setError('Failed to load GitHub settings');
      }
    };

    loadSettings();
  }, []);

  const handleGitHubTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!githubToken.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    try {
      setIsLoading(true);
      // Save the token only if it's verified
      await githubTokenStorage.set(githubToken);
      setGithubToken(''); // Clear the input field
      setHasToken(true);

      // Show success toast
      onToast(t('settingsSavedSuccess'), 'success');
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

      // Show success toast
      onToast(t('remove'), 'success');
    } catch (err) {
      console.error('Error removing GitHub token:', err);
      setError('Failed to remove token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubApiDomainChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDomain = e.target.value;
    setGithubApiDomain(newDomain);
  };

  const handleGithubApiDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);

      // Simple validation for URL format
      const url = new URL(githubApiDomain);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL format');
      }

      await githubApiDomainStorage.set(githubApiDomain);

      // Show success toast
      onToast(t('settingsSavedSuccess'), 'success');
    } catch (err) {
      console.error('Error saving GitHub API domain:', err);
      setError('Please enter a valid URL (e.g. https://api.github.com)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetApiDomain = async () => {
    try {
      setIsLoading(true);
      await githubApiDomainStorage.clear();
      setGithubApiDomain('https://api.github.com');

      // Show success toast
      onToast(t('resetToDefault'), 'success');
    } catch (err) {
      console.error('Error resetting GitHub API domain:', err);
      setError('Failed to reset API domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">{t('githubIntegration')}</h2>

      {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">{error}</div>}

      <form onSubmit={handleGitHubTokenSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 mb-1">
            {t('githubToken')}
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
              {isLoading ? t('verifying') : t('save')}
            </button>
          </div>
          {hasToken && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{t('tokenIsSet')}</span>
              <button type="button" onClick={handleRemoveToken} className="text-xs text-red-500 hover:text-red-700">
                {t('remove')}
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>
            {t('githubTokenStorageNotice')}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=PR+Checklistify+Extension"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:text-blue-700 ml-1">
              {t('createGithubToken')}
            </a>
          </p>
        </div>
      </form>

      <form onSubmit={handleGithubApiDomainSubmit}>
        <div className="mb-4">
          <label htmlFor="github-api-domain" className="block text-sm font-medium text-gray-700 mb-1">
            {t('githubApiDomain')}
          </label>
          <div className="flex">
            <input
              type="text"
              id="github-api-domain"
              value={githubApiDomain}
              onChange={handleGithubApiDomainChange}
              placeholder="https://api.github.com"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 ${
                isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {isLoading ? t('saving') : t('save')}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">{t('githubEnterpriseNotice')}</span>
            <button type="button" onClick={handleResetApiDomain} className="text-xs text-blue-500 hover:text-blue-700">
              {t('resetToDefault')}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default GitHubIntegrationSettings;
