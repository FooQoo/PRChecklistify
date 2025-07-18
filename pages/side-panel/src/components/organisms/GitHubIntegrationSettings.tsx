import type React from 'react';
import { useState, useEffect } from 'react';
import { useGithubTokensAtom } from '../../hooks/useGithubTokensAtom';
import { useI18n } from '@extension/i18n';
import GitHubServerTokenCard from '../molecules/GitHubServerTokenCard';
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
    await refreshServers();
  };

  const handleRemoveToken = async (serverId: string) => {
    await removeToken(serverId);
    await refreshServers();
  };

  const handleSetActive = async (serverId: string) => {
    await setActiveServer(serverId);
    await refreshServers();
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

          <div className="space-y-3">
            {servers.map(server => (
              <GitHubServerTokenCard
                key={server.id}
                server={server}
                isActive={server.id === activeServerId}
                onSetToken={handleSetToken}
                onRemoveToken={handleRemoveToken}
                onSetActive={handleSetActive}
                onToast={onToast}
              />
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>{t('githubTokenStorageNotice')}</p>
        <p className="mt-2">
          <strong>Server Configuration:</strong> GitHub servers are pre-configured at build time. Only API tokens can be
          managed through this interface.
        </p>
        <p className="mt-1">
          <strong>Enterprise Setup:</strong> Contact your administrator to add GitHub Enterprise servers to the build
          configuration.
        </p>
      </div>
    </>
  );
};

export default GitHubIntegrationSettings;
