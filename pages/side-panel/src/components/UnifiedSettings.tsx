import { useI18n } from '@extension/i18n';
import { useOpenaiKeyAtom } from '../hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '../hooks/useGeminiKeyAtom';
import { useGithubTokenAtom } from '../hooks/useGithubTokenAtom';
import { useInstructionPathAtom } from '../hooks/useInstructionPathAtom';
import SettingSection, { type SettingConfig } from './common/SettingSection';
import { isGeminiApiEnabled } from '../utils/envUtils';

type UnifiedSettingsProps = {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();

  // Hooks
  const { openaiKey, setKeyAndStorage: setOpenAIKey, clearKey: clearOpenAIKey } = useOpenaiKeyAtom();
  const { geminiKey, setKeyAndStorage: setGeminiKey, clearKey: clearGeminiKey } = useGeminiKeyAtom();
  const { githubToken, setTokenAndStorage: setGitHubToken, clearToken: clearGitHubToken } = useGithubTokenAtom();
  const {
    path: instructionPath,
    setPathAndStorage: setInstructionPath,
    clearPath: clearInstructionPath,
  } = useInstructionPathAtom();

  // Validators
  const validateOpenAIKey = (key: string): boolean => key.startsWith('sk-');
  const validateGeminiKey = (key: string): boolean => key.startsWith('AIza');
  const validateGitHubToken = (token: string): boolean => token.startsWith('ghp_') || token.startsWith('github_pat_');
  const validatePath = (path: string): boolean => !!path.trim();

  // Mask functions
  const getMaskedKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };
  const getPlainValue = (value: string): string => value;

  // AI Keys Section
  const aiKeysConfigs: SettingConfig[] = [
    {
      key: 'openai-api-key',
      label: t('openaiApiKey'),
      value: openaiKey,
      placeholder: 'sk-...',
      type: 'password',
      onSave: setOpenAIKey,
      onRemove: clearOpenAIKey,
      validator: validateOpenAIKey,
      errorMessage: t('invalidApiKeyFormat'),
      successMessage: t('apiKeySavedSuccess'),
      keySetText: t('apiKeyIsSet'),
      getMaskedValue: getMaskedKey,
      helpText: t('openaiKeyStorageNotice'),
      helpLink: {
        url: 'https://platform.openai.com/account/api-keys',
        text: t('getOpenAIKey'),
      },
    },
  ];

  // Add Gemini if enabled
  if (isGeminiApiEnabled()) {
    aiKeysConfigs.push({
      key: 'gemini-api-key',
      label: t('geminiApiKey'),
      value: geminiKey,
      placeholder: t('enterGeminiApiKey'),
      type: 'password',
      onSave: setGeminiKey,
      onRemove: clearGeminiKey,
      validator: validateGeminiKey,
      errorMessage: t('invalidGeminiApiKeyFormat'),
      successMessage: t('geminiApiKeySavedSuccess'),
      keySetText: t('geminiApiKeyIsSet'),
      getMaskedValue: getMaskedKey,
      helpText: t('geminiKeyStorageNotice'),
    });
  }

  // GitHub Integration Section
  const githubConfigs: SettingConfig[] = [
    {
      key: 'github-token',
      label: t('githubToken'),
      value: githubToken,
      placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
      type: 'password',
      onSave: setGitHubToken,
      onRemove: clearGitHubToken,
      validator: validateGitHubToken,
      errorMessage: 'Invalid GitHub token format',
      successMessage: t('settingsSavedSuccess'),
      keySetText: t('tokenIsSet'),
      getMaskedValue: getMaskedKey,
      helpText: t('githubTokenStorageNotice'),
      helpLink: {
        url: 'https://github.com/settings/tokens/new?scopes=repo&description=PR+Checklistify+Extension',
        text: t('createGithubToken'),
      },
    },
  ];

  // Application Settings Section
  const appConfigs: SettingConfig[] = [
    {
      key: 'instruction-path',
      label: t('instructionPath'),
      value: instructionPath,
      placeholder: t('instructionPathPlaceholder'),
      type: 'text',
      onSave: setInstructionPath,
      onRemove: clearInstructionPath,
      validator: validatePath,
      errorMessage: t('invalidPathFormat'),
      successMessage: t('settingsSavedSuccess'),
      keySetText: t('pathIsSet'),
      getMaskedValue: getPlainValue,
    },
  ];

  return (
    <div className="unified-settings">
      <SettingSection title="AI API Keys" configs={aiKeysConfigs} onToast={onToast} />

      <SettingSection title={t('githubIntegration')} configs={githubConfigs} onToast={onToast} />

      <SettingSection title="Application Settings" configs={appConfigs} onToast={onToast} />
    </div>
  );
};

export default UnifiedSettings;
