import type React from 'react';
import { useState } from 'react';
import type { GitHubServer } from '@extension/storage';

interface GitHubServerTokenCardProps {
  server: GitHubServer & { token?: string; hasToken: boolean };
  isActive: boolean;
  onSetToken: (serverId: string, token: string) => void;
  onRemoveToken: (serverId: string) => void;
  onSetActive: (serverId: string) => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubServerTokenCard: React.FC<GitHubServerTokenCardProps> = ({
  server,
  isActive,
  onSetToken,
  onRemoveToken,
  onSetActive,
  onToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  const handleSave = () => {
    if (!tokenInput.trim()) {
      onToast('Please enter a valid token', 'error');
      return;
    }

    // Basic token validation
    if (!tokenInput.startsWith('ghp_') && !tokenInput.startsWith('github_pat_')) {
      onToast('Invalid GitHub token format', 'error');
      return;
    }

    onSetToken(server.id, tokenInput.trim());
    setIsEditing(false);
    setTokenInput('');
    onToast('Token saved successfully', 'success');
  };

  const handleCancel = () => {
    setTokenInput('');
    setIsEditing(false);
  };

  const handleRemove = () => {
    if (confirm(`Are you sure you want to remove the token for "${server.name}"?`)) {
      onRemoveToken(server.id);
      onToast('Token removed', 'success');
    }
  };

  const getMaskedToken = (token: string): string => {
    if (!token || token.length < 10) return '****';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  };

  return (
    <div className={`p-4 border rounded-lg ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{server.name}</h3>
            {isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">{server.apiUrl}</p>

          {server.description && <p className="text-sm text-gray-500 mt-1">{server.description}</p>}

          <div className="mt-2">
            {server.hasToken ? (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✓ Token Set
                </span>
                <span className="text-xs text-gray-400">{getMaskedToken(server.token || '')}</span>
              </div>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                ⚠ No Token
              </span>
            )}
          </div>

          {isEditing && (
            <div className="mt-3 space-y-2">
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-1 ml-4">
          {!isActive && server.hasToken && (
            <button
              onClick={() => onSetActive(server.id)}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
              Set Active
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            {server.hasToken ? 'Update' : 'Add'} Token
          </button>

          {server.hasToken && (
            <button onClick={handleRemove} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
              Remove Token
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <a
          href={`${server.webUrl}/settings/tokens/new?scopes=repo&description=PR+Checklistify+Extension`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:text-blue-700">
          Create a personal access token →
        </a>
      </div>
    </div>
  );
};

export default GitHubServerTokenCard;
