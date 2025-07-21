import type React from 'react';
import { useState } from 'react';
import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import { useGithubTokensAtom } from '@src/hooks/useGithubTokensAtom';
import GitHubIntegrationSettings from '@src/components/organisms/GitHubIntegrationSettings';
import { CenteredCard, Toast } from '@src/components/atoms';
import { useNavigation } from './NavigationContext';

const GithubTokenSetupView: React.FC = () => {
  const { navigateToHome, navigateToOpenAiTokenSetup } = useNavigation();
  const { t } = useI18n();
  const { openaiKey } = useOpenaiKeyAtom();
  const { githubTokens } = useGithubTokensAtom();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // トークンが設定されたかどうかをチェック
  const hasGitHubToken = githubTokens && githubTokens.tokens.length > 0;

  const handleToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleContinue = () => {
    if (openaiKey) {
      navigateToHome();
    } else {
      navigateToOpenAiTokenSetup();
    }
  };

  return (
    <CenteredCard cardClassName="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{t('githubIntegration')} Setup</h2>
        <p className="text-sm mb-4 text-gray-600" dangerouslySetInnerHTML={{ __html: t('githubSetupDescription') }} />
        {hasGitHubToken && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">✓ {t('githubTokensConfigured')}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <GitHubIntegrationSettings onToast={handleToast} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!hasGitHubToken}
          className={`px-4 py-2 rounded-lg transition-colors ${
            hasGitHubToken ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>
          {t('continueSetup')}
        </button>
      </div>

      {/* Toast Message */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          visible={!!toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </CenteredCard>
  );
};

export default GithubTokenSetupView;
