import { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import OpenAIKeySettings from '../components/OpenAIKeySettings';
import { githubTokenStorage, languagePreferenceStorage, githubApiDomainStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import Toast from '../components/Toast';

const SettingsView: React.FC = () => {
  const { navigateToHome } = useNavigation();
  const [githubToken, setGithubToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [githubApiDomain, setGithubApiDomain] = useState('https://api.github.com');
  const [, setOpenaiApiEndpoint] = useState('');
  const [, setHasCustomOpenaiEndpoint] = useState(false);
  const [, setRecentPRs] = useState<{ url: string; title: string; timestamp: number }[]>([]);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

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

        // Load language preference
        const savedLanguage = await languagePreferenceStorage.get();

        setLanguage(savedLanguage);

        // Load OpenAI API endpoint
        const result = await chrome.storage.local.get('openaiApiEndpoint');
        if (result.openaiApiEndpoint) {
          setOpenaiApiEndpoint(result.openaiApiEndpoint);
          setHasCustomOpenaiEndpoint(true);
        }

        // Load recent PRs
        const prResult = await chrome.storage.local.get('recentPRs');
        if (prResult.recentPRs && Array.isArray(prResult.recentPRs)) {
          const sortedPRs = [...prResult.recentPRs].sort((a, b) => b.timestamp - a.timestamp);
          setRecentPRs(sortedPRs);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      }
    };

    loadSettings();
  }, []);

  // Close toast handler
  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

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
      setToast({
        visible: true,
        message: t('settingsSavedSuccess'),
        type: 'success',
      });
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
      setToast({
        visible: true,
        message: t('remove'),
        type: 'success',
      });
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
      // Save language preference to storage
      await languagePreferenceStorage.set(newLanguage as 'en' | 'ja' | 'ko' | 'zh');

      // Save to chrome.storage.local for i18n to access
      await chrome.storage.local.set({ languagePreference: newLanguage });

      // For development environment, store the preference to be used on next reload
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('CEB_DEV_LOCALE', newLanguage);
      }

      // Show success toast
      setToast({
        visible: true,
        message: t('settingsSavedSuccess'),
        type: 'success',
      });
    } catch (err) {
      console.error('Error saving language preference:', err);
      setError('Failed to save language preference');
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
      setToast({
        visible: true,
        message: t('settingsSavedSuccess'),
        type: 'success',
      });
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
      setToast({
        visible: true,
        message: t('resetToDefault'),
        type: 'success',
      });
    } catch (err) {
      console.error('Error resetting GitHub API domain:', err);
      setError('Failed to reset API domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={handleCloseToast}
        duration={3000}
      />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{t('settings')}</h1>
          <button onClick={navigateToHome} className="text-blue-500 hover:text-blue-700 text-sm flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('backToHome')}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                    isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } rounded-r-md`}>
                  {isLoading ? t('saving') : t('save')}
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('githubEnterpriseNotice')}</span>
                <button
                  type="button"
                  onClick={handleResetApiDomain}
                  className="text-xs text-blue-500 hover:text-blue-700">
                  {t('resetToDefault')}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('openaiIntegration')}</h2>
          <OpenAIKeySettings />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">{t('preferences')}</h2>

          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              {t('analysisLanguage')}
            </label>
            <select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한글</option>
              <option value="zh">中文</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('analysisLanguageDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
