import type React from 'react';
import { useState } from 'react';
import { useGithubServersAtom } from '../../hooks/useGithubServersAtom';
import { useGithubTokensAtom } from '../../hooks/useGithubTokensAtom';
import { useI18n } from '@extension/i18n';
import type { GitHubServer } from '@extension/storage';
import { Button } from '../atoms';
import ServerListItem from '../molecules/ServerListItem';
import { ServerFormCard } from '../molecules';

interface GitHubServerManagementProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

const GitHubServerManagement: React.FC<GitHubServerManagementProps> = ({ onToast, className = '' }) => {
  const { t } = useI18n();
  const { githubServers, addServer, updateServer, removeServer, isGithubServersLoaded } = useGithubServersAtom();

  const { githubTokens, setToken, removeToken, isGithubTokensLoaded } = useGithubTokensAtom();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServer, setEditingServer] = useState<GitHubServer | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const isLoading = !isGithubServersLoaded || !isGithubTokensLoaded;

  // Get combined server data with token status
  const serversWithTokenStatus = (githubServers || []).map(server => {
    const tokenInfo = githubTokens?.tokens.find(t => t.serverId === server.id);
    const hasToken = !!tokenInfo;
    return {
      ...server,
      hasToken,
      token: tokenInfo?.token,
    };
  });

  const handleAddServer = async (server: GitHubServer) => {
    await addServer(server);
    setShowAddForm(false);
  };

  const handleUpdateServer = async (server: GitHubServer) => {
    if (!editingServer) return;
    await updateServer(editingServer.id, server);
    setEditingServer(null);
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      await removeServer(serverId);
      setDeleteConfirmation(null);
      onToast(t('serverDeletedSuccess'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('serverDeleteError');
      onToast(message, 'error');
    }
  };

  const handleSetToken = async (serverId: string, token: string) => {
    try {
      await setToken(serverId, token);
      onToast(t('tokenSavedSuccess'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('tokenSaveError');
      onToast(message, 'error');
      throw error;
    }
  };

  const handleRemoveToken = async (serverId: string) => {
    try {
      await removeToken(serverId);
      onToast(t('tokenRemovedSuccess'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('tokenRemoveError');
      onToast(message, 'error');
      throw error;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <h2 className="text-lg font-semibold mb-4">{t('githubServers')}</h2>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Show edit form
  if (editingServer) {
    return (
      <div className={className}>
        <ServerFormCard
          mode="edit"
          server={editingServer}
          existingServers={githubServers || []}
          onSave={handleUpdateServer}
          onCancel={() => setEditingServer(null)}
          onToast={onToast}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {t('githubServers')} ({serversWithTokenStatus.length})
        </h2>
        <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)} className="text-sm">
          {t('addServer')}
        </Button>
      </div>

      {/* Empty state */}
      {serversWithTokenStatus.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">🌐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noGitHubServers')}</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">{t('noGitHubServersDescription')}</p>
          <Button variant="primary" onClick={() => setShowAddForm(true)}>
            {t('addFirstServer')}
          </Button>
        </div>
      ) : (
        <>
          {/* Server list */}
          <div className="space-y-4 mb-6">
            {serversWithTokenStatus.map(server => (
              <ServerListItem
                key={server.id}
                server={server}
                hasToken={server.hasToken}
                onEdit={setEditingServer}
                onDelete={setDeleteConfirmation}
                onSetToken={handleSetToken}
                onRemoveToken={handleRemoveToken}
                totalServers={serversWithTokenStatus.length}
                onToast={onToast}
              />
            ))}

            {/* Add server card */}
            {showAddForm && (
              <ServerFormCard
                mode="create"
                existingServers={githubServers || []}
                onSave={handleAddServer}
                onCancel={() => setShowAddForm(false)}
                onToast={onToast}
              />
            )}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('confirmDeleteServer')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('deleteServerWarning')}</p>
            <div className="flex items-center justify-end space-x-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmation(null)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteServer(deleteConfirmation)}>
                {t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubServerManagement;
