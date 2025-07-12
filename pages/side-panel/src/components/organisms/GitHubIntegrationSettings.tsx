import { useGithubTokenAtom } from '../../hooks/useGithubTokenAtom';
import { useI18n } from '@extension/i18n';
import { TextInput } from '../atoms';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { githubToken, setTokenAndStorage, clearToken } = useGithubTokenAtom();

  // GitHub トークンのバリデーション
  const validateGitHubToken = (token: string): boolean => {
    return token.startsWith('ghp_') || token.startsWith('github_pat_');
  };

  // トークンのマスク表示
  const getMaskedToken = (token: string): string => {
    if (!token || token.length < 10) return '****';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">{t('githubIntegration')}</h2>
      <div className="mb-6">
        <TextInput
          label={t('githubToken')}
          value={githubToken}
          placeholder="xxxxxxxxxxxxxxxxxxxx"
          type="password"
          onSave={setTokenAndStorage}
          onRemove={clearToken}
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
      </div>
    </>
  );
};

export default GitHubIntegrationSettings;
