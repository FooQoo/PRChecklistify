import type React from 'react';
import { useState, useEffect } from 'react';
import { useGithubTokensAtom } from '../../hooks/useGithubTokensAtom';
import { useI18n } from '@extension/i18n';
import { getGitHubServersWithTokens } from '../../services/configLoader';
import type { GitHubServer } from '@extension/storage';
import { TextInput } from '../molecules';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { setToken, removeToken, isGithubTokensLoaded } = useGithubTokensAtom();

  const [servers, setServers] = useState<Array<GitHubServer & { token?: string; hasToken: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load servers from external config
  useEffect(() => {
    const loadServers = async () => {
      try {
        const serversWithTokens = await getGitHubServersWithTokens();
        setServers(serversWithTokens);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        onToast(t('failedToLoadGitHubConfig'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (isGithubTokensLoaded) {
      loadServers();
    }
  }, [isGithubTokensLoaded, onToast, t]);

  // Refresh servers when tokens change
  const refreshServers = async () => {
    const serversWithTokens = await getGitHubServersWithTokens();
    setServers(serversWithTokens);
  };

  const handleSetToken = async (serverId: string, token: string) => {
    await setToken(serverId, token);
    await refreshServers();
  };

  const handleRemoveToken = async (serverId: string) => {
    await removeToken(serverId);
    await refreshServers();
  };

  // トークンのマスク表示
  const getMaskedToken = (token: string): string => {
    if (!token || token.length < 10) return '****';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  };

  if (isLoading || !isGithubTokensLoaded) {
    return (
      <div className="animate-pulse">
        <h2 className="text-lg font-semibold mb-4">GitHub Integration</h2>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">{t('githubIntegration')}</h2>

      {servers.length === 0 ? (
        <div className="mb-6">
          <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600 mb-3">{t('noGitHubServersConfigured')}</p>
            <p className="text-xs text-gray-500">
              {t('gitHubServersDefinedIn')} <code>config/github-servers.json</code> {t('andLoadedAtBuildTime')}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {t('configureApiTokens')} ({servers.length} available)
            </p>
          </div>

          <div className="space-y-6">
            {servers.map(server => (
              <div key={server.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {server.hasToken && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {t('configured')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <TextInput
                  label={`${server.name} Token`}
                  value={server.token}
                  placeholder="xxxxxxxxxxxxxxxxxxxx"
                  type="password"
                  onSave={token => handleSetToken(server.id, token)}
                  onRemove={server.hasToken ? () => handleRemoveToken(server.id) : undefined}
                  errorMessage={t('invalidGitHubTokenFormat')}
                  successMessage={t('settingsSavedSuccess')}
                  removeText={t('remove')}
                  saveText={t('save')}
                  savingText={t('verifying')}
                  keySetText={t('tokenIsSet')}
                  getMaskedValue={getMaskedToken}
                  onToast={onToast}
                />

                <div className="text-xs text-gray-500 mt-2">
                  <a
                    href={`${server.webUrl}/settings/tokens/new?scopes=repo&description=PR+Checklistify+Extension`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-700">
                    {t('createGithubToken')} for {server.name} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>{t('githubTokenStorageNotice')}</p>
      </div>
    </>
  );
};

export default GitHubIntegrationSettings;
