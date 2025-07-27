import type React from 'react';
import { useI18n } from '@extension/i18n';
import GitHubServerManagement from './GitHubServerManagement';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();

  return (
    <>
      <h2 className="text-lg font-semibold mb-6">{t('githubIntegration')}</h2>

      {/* GitHub setup description */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: t('githubSetupDescription') }} />
      </div>

      {/* Unified GitHub Server and Token Management */}
      <GitHubServerManagement onToast={onToast} />
    </>
  );
};

export default GitHubIntegrationSettings;
