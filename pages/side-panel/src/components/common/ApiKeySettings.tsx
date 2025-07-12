import { useI18n } from '@extension/i18n';
import TextInput from './TextInput';

export type ApiProvider = {
  id: string;
  name: string;
  placeholder: string;
  link: string;
  linkText: string;
  validate: (key: string) => boolean;
  invalidMsg: string;
  desc: string;
  keySetText: string;
  keyStorageNotice: string;
  getMaskedValue?: (key: string) => string;
  modelOptions?: Array<{ value: string; label: string }>;
};

export type ApiKeySettingsProps = {
  provider: ApiProvider;
  apiKey?: string;
  selectedModel?: string;
  onSave: (value: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  onModelChange?: (model: string) => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
  showModelSelector?: boolean;
};

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  provider,
  apiKey,
  selectedModel,
  onSave,
  onRemove,
  onModelChange,
  onToast,
  showModelSelector = false,
}) => {
  const { t } = useI18n();

  const defaultGetMaskedValue = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const getMaskedValue = provider.getMaskedValue || defaultGetMaskedValue;

  return (
    <div className={`${provider.id}-settings`}>
      <TextInput
        label={`${provider.name} API Key`}
        value={apiKey}
        placeholder={provider.placeholder}
        type="password"
        onSave={onSave}
        onRemove={onRemove}
        validator={provider.validate}
        errorMessage={provider.invalidMsg}
        successMessage={t('apiKeySavedSuccess')}
        removeText={t('remove')}
        saveText={t('save')}
        savingText={t('saving')}
        keySetText={provider.keySetText}
        getMaskedValue={getMaskedValue}
        onToast={onToast}
      />

      {showModelSelector && provider.modelOptions && (
        <div className="mb-4">
          <label htmlFor={`${provider.id}-model`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('modelVersion')}
          </label>
          <select
            id={`${provider.id}-model`}
            value={selectedModel}
            onChange={e => onModelChange?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {provider.modelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        <p>
          {provider.keyStorageNotice}
          <a href={provider.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 ml-1">
            {provider.linkText}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeySettings;
