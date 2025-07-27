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
      <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('githubSetupDescription') }} />

      {/* Unified GitHub Server and Token Management */}
      <GitHubServerManagement onToast={onToast} />
    </>
  );
};

export default GitHubIntegrationSettings;
