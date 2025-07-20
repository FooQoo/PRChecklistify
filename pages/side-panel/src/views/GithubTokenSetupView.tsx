import type React from 'react';
import { useState } from 'react';
import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import { useGithubTokensAtom } from '@src/hooks/useGithubTokensAtom';
import GitHubIntegrationSettings from '@src/components/organisms/GitHubIntegrationSettings';
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
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
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
              hasGitHubToken
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}>
            Continue Setup
          </button>
        </div>

        {/* Toast Message */}
        {toastMessage && (
          <div
            className={`fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
              toastMessage.type === 'success'
                ? 'bg-green-500 text-white'
                : toastMessage.type === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
            }`}>
            {toastMessage.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubTokenSetupView;
