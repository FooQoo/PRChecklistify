import { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import OpenAIKeySettings from '../components/OpenAIKeySettings';
import GitHubIntegrationSettings from '../components/GitHubIntegrationSettings';
import GeminiKeySettings from '../components/GeminiKeySettings';
import ClaudeKeySettings from '../components/ClaudeKeySettings';
import InstructionPathSettings from '../components/InstructionPathSettings';
import { useModelClientTypeAtom } from '../hooks/useModelClientTypeAtom';
import type { Language } from '@extension/storage';
import { useI18n } from '@extension/i18n';
import Toast from '../components/Toast';
import { isGeminiApiEnabled } from '../utils/envUtils';

const SettingsView: React.FC = () => {
  const { navigateToHome } = useNavigation();
  const { language, setLanguage, t } = useI18n();
  const [, setOpenaiApiEndpoint] = useState('');
  const [, setHasCustomOpenaiEndpoint] = useState(false);
  const [, setRecentPRs] = useState<{ url: string; title: string; timestamp: number }[]>([]);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [pendingLanguageToast, setPendingLanguageToast] = useState(false);
  // modelClientTypeのJotai hooksを利用
  const { modelClientType, setTypeAndStorage } = useModelClientTypeAtom();
  // Geminiエンドポイント有効判定
  const geminiEnabled = isGeminiApiEnabled();

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load OpenAI API endpoint
        const result = await chrome.storage.local.get('openaiApiEndpoint');
        if (result.openaiApiEndpoint) {
          setOpenaiApiEndpoint(result.openaiApiEndpoint);
          setHasCustomOpenaiEndpoint(true);
        }

        // Load recent PRs
        const prResult = await chrome.storage.local.get('recentPRs');
        if (prResult.recentPRs && Array.isArray(prResult.recentPRs)) {
          const sortedPRs = [...prResult.recentPRs].sort((a, b) => b.timestamp - a.timestamp);
          setRecentPRs(sortedPRs);
        }
      } catch {
        console.error('Error loading settings');
        showToast('Failed to load settings', 'error');
      }
    };

    loadSettings();
  }, []);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  // Close toast handler
  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (pendingLanguageToast) {
      showToast(t('settingsSavedSuccess'), 'success');
      setPendingLanguageToast(false);
    }
  }, [pendingLanguageToast, t]);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as Language;
    await setLanguage(newLanguage);
    setPendingLanguageToast(true);
  };

  // handleModelClientTypeChangeをhooks経由に
  const handleModelClientTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as typeof modelClientType;
    await setTypeAndStorage(newType);
    // Jotai atomの値はhooksで自動的に反映される
    showToast(t('modelClientTypeSaved'), 'success');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={handleCloseToast}
        duration={3000}
      />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{t('settings')}</h1>
          <div
            role="button"
            tabIndex={0}
            onClick={navigateToHome}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateToHome();
              }
            }}
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('backToHome')}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <GitHubIntegrationSettings onToast={showToast} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('aiProvider')}</h2>
          <label htmlFor="modelClientType" className="block text-sm font-medium text-gray-700 mb-1">
            {t('selectAiProvider')}
          </label>
          <select
            id="modelClientType"
            value={modelClientType}
            onChange={handleModelClientTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="openai">OpenAI</option>
            {geminiEnabled && <option value="gemini">Gemini</option>}
            <option value="claude">Claude</option>
          </select>
          {modelClientType === 'openai' && (
            <>
              <h2 className="text-lg font-semibold mb-4">{t('openaiIntegration')}</h2>
              <OpenAIKeySettings onToast={showToast} />
            </>
          )}
          {modelClientType === 'gemini' && geminiEnabled && (
            <>
              <h2 className="text-lg font-semibold mb-4">{t('geminiIntegration')}</h2>
              <GeminiKeySettings onToast={showToast} />
            </>
          )}
          {modelClientType === 'claude' && (
            <>
              <h2 className="text-lg font-semibold mb-4">{t('claudeIntegration')}</h2>
              <ClaudeKeySettings onToast={showToast} />
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">{t('preferences')}</h2>

          <InstructionPathSettings onToast={showToast} />

          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              {t('analysisLanguage')}
            </label>
            <select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한글</option>
              <option value="zh">中文</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('analysisLanguageDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
