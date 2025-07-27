import type React from 'react';
import type { GitHubServer } from '@extension/storage';
import { useI18n } from '@extension/i18n';
import { Button } from '../atoms';
import { TextInput } from '../molecules';
import ServerStatusIndicator from '../atoms/ServerStatusIndicator';
import type { ServerStatus } from '../atoms/ServerStatusIndicator';

interface ServerListItemProps {
  server: GitHubServer & { token?: string }; // Include token in server object
  hasToken: boolean;
  onEdit: (server: GitHubServer) => void;
  onDelete: (serverId: string) => void;
  onSetToken: (serverId: string, token: string) => Promise<void>;
  onRemoveToken: (serverId: string) => Promise<void>;
  totalServers: number; // Total number of servers to determine if deletion is allowed
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

const ServerListItem: React.FC<ServerListItemProps> = ({
  server,
  hasToken,
  onEdit,
  onDelete,
  onSetToken,
  onRemoveToken,
  totalServers,
  onToast,
  className = '',
}) => {
  const { t } = useI18n();

  const getServerStatus = (): ServerStatus => {
    if (hasToken) return 'configured';
    return 'no-token';
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return `${url.substring(0, maxLength - 3)}...`;
  };

  // サーバーのwebUrlから動的にトークン作成URLを生成
  const getTokenCreationUrl = (): string => {
    const params = new URLSearchParams({
      scopes: 'repo',
      description: 'PR Checklistify',
    });
    const url = new URL(server.webUrl);
    return `${url.origin}/settings/tokens/new?${params.toString()}`;
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors ${className}`}>
      {/* Header with name and status */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{server.name}</h3>
          <ServerStatusIndicator status={getServerStatus()} />
        </div>
      </div>

      {/* URLs */}
      <div className="space-y-1 mb-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{t('apiUrl')}: </span>
          <span className="font-mono" title={server.apiUrl}>
            {truncateUrl(server.apiUrl)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{t('webUrl')}: </span>
          <a
            href={server.webUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
            title={server.webUrl}>
            {truncateUrl(server.webUrl)}
          </a>
        </div>
      </div>

      {/* Token management section */}
      <div className="border-t border-gray-100 pt-3 mt-3">
        <div className="mb-3">
          <TextInput
            label={t('accessToken')}
            value={server.token}
            placeholder={t('enterGitHubToken')}
            type="password"
            onSave={async (token: string) => {
              await onSetToken(server.id, token);
            }}
            onRemove={async () => {
              await onRemoveToken(server.id);
            }}
            validator={(token: string) => token.trim().length > 0}
            errorMessage={t('tokenCannotBeEmpty')}
            successMessage={t('tokenSavedSuccess')}
            removeText={t('removeToken')}
            saveText={t('save')}
            savingText={t('saving')}
            keySetText={t('configured')}
            keyNotSetText={t('notConfigured')}
            onToast={onToast}
          />
        </div>

        {/* Token creation guidance */}
        <div className="text-xs text-gray-500">
          <p className="mb-1">{t('githubTokenStorageNotice')}</p>
          <a
            href={getTokenCreationUrl()}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline">
            {t('createGithubToken')}
          </a>
        </div>
      </div>

      {/* Actions section */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(server)} className="text-xs">
            {t('editServer')}
          </Button>
        </div>

        {/* Delete button - show if there are 2 or more servers */}
        {totalServers >= 2 && (
          <Button variant="danger" size="sm" onClick={() => onDelete(server.id)} className="text-xs">
            {t('delete')}
          </Button>
        )}
      </div>

      {/* Server info tooltip on mobile/small screens */}
      <div className="mt-2 text-xs text-gray-500">
        ID: <span className="font-mono">{server.id}</span>
      </div>
    </div>
  );
};

export default ServerListItem;
