import type React from 'react';
import { useState } from 'react';
import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import GitHubIntegrationSettings from '@src/components/organisms/GitHubIntegrationSettings';
import { CenteredCard, Toast } from '@src/components/atoms';
import { useNavigation } from './NavigationContext';

const GithubTokenSetupView: React.FC = () => {
  const { navigateToHome, navigateToOpenAiTokenSetup } = useNavigation();
  const { t } = useI18n();
  const { openaiKey } = useOpenaiKeyAtom();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

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
        <GitHubIntegrationSettings onToast={handleToast} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          className={`px-4 py-2 rounded-lg transition-colors ${'bg-blue-500 text-white hover:bg-blue-600'}`}>
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
