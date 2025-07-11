import { useState } from 'react';
import { useGithubTokenAtom } from '../hooks/useGithubTokenAtom';
import { useI18n } from '@extension/i18n';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const { githubToken, setTokenAndStorage, clearToken } = useGithubTokenAtom();
  const [inputToken, setInputToken] = useState('');

  const handleGitHubTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      return;
    }
    try {
      setIsLoading(true);
      await setTokenAndStorage(inputToken);
      setInputToken('');
      onToast(t('settingsSavedSuccess'), 'success');
    } catch (err) {
      console.error('Token verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveToken = async () => {
    try {
      setIsLoading(true);
      await clearToken();
      setInputToken('');
      onToast(t('remove'), 'success');
    } catch (err) {
      console.error('Error removing GitHub token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">{t('githubIntegration')}</h2>
      <form onSubmit={handleGitHubTokenSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 mb-1">
            {t('githubToken')}
          </label>
          <div className="flex">
            <input
              type="password"
              id="github-token"
              value={inputToken}
              onChange={e => setInputToken(e.target.value)}
              placeholder={githubToken ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:z-10 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputToken.trim()}
              className={`px-4 py-2 ${
                isLoading || !inputToken.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {isLoading ? t('verifying') : t('save')}
            </button>
          </div>
          {githubToken && (
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
    </>
  );
};

export default GitHubIntegrationSettings;
