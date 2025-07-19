import type React from 'react';
import { useState, useEffect } from 'react';
import { useGithubTokensAtom } from '../../hooks/useGithubTokensAtom';
import { useI18n } from '@extension/i18n';
import { TextInput } from '../atoms';
import { getGitHubServersWithTokens } from '../../services/configLoader';
import type { GitHubServer } from '@extension/storage';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { setToken, removeToken, setActiveServer, getActiveServerId, isGithubTokensLoaded } = useGithubTokensAtom();

  const [servers, setServers] = useState<Array<GitHubServer & { token?: string; hasToken: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeServerId = getActiveServerId();

  // Load servers from external config
  useEffect(() => {
    const loadServers = async () => {
      try {
        const serversWithTokens = await getGitHubServersWithTokens();
        setServers(serversWithTokens);
      } catch (error) {
        console.error('Failed to load GitHub servers:', error);
        onToast('Failed to load GitHub server configuration', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (isGithubTokensLoaded) {
      loadServers();
    }
  }, [isGithubTokensLoaded, onToast]);

  // Refresh servers when tokens change
  const refreshServers = async () => {
    try {
      const serversWithTokens = await getGitHubServersWithTokens();
      setServers(serversWithTokens);
    } catch (error) {
      console.error('Failed to refresh servers:', error);
    }
  };

  const handleSetToken = async (serverId: string, token: string) => {
    await setToken(serverId, token);
    // トークンが設定されたら自動的にそのサーバーをアクティブにする
    await setActiveServer(serverId);
    await refreshServers();
  };

  const handleRemoveToken = async (serverId: string) => {
    await removeToken(serverId);
    await refreshServers();
  };

  // GitHub トークンのバリデーション
  const validateGitHubToken = (token: string): boolean => {
    return token.startsWith('ghp_') || token.startsWith('github_pat_');
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
            <p className="text-sm text-gray-600 mb-3">
              No GitHub servers configured. Please check your build configuration.
            </p>
            <p className="text-xs text-gray-500">
              GitHub servers are defined in <code>config/github-servers.json</code> and loaded at build time.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Configure API tokens for GitHub servers ({servers.length} available)
            </p>
          </div>

          <div className="space-y-6">
            {servers.map(server => (
              <div key={server.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {server.id === activeServerId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Active
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
                  validator={validateGitHubToken}
                  errorMessage="Invalid GitHub token format"
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
