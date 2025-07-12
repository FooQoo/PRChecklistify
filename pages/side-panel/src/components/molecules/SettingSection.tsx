import type React from 'react';
import { useI18n } from '@extension/i18n';
import { TextInput } from '../atoms';

export interface SettingConfig {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  value?: string;
  onSave: (value: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  successMessage?: string;
  keySetText?: string;
  getMaskedValue?: (value: string) => string;
  helpText?: string;
  helpLink?: {
    url: string;
    text: string;
  };
}

export interface SettingSectionProps {
  title?: string;
  configs: SettingConfig[];
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, configs, onToast }) => {
  const { t } = useI18n();

  return (
    <div className="setting-section">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}

      {configs.map(config => (
        <div key={config.key} className="mb-6">
          <TextInput
            label={config.label}
            value={config.value}
            placeholder={config.placeholder}
            type={config.type || 'password'}
            onSave={config.onSave}
            onRemove={config.onRemove}
            validator={config.validator}
            errorMessage={config.errorMessage || 'Invalid format'}
            successMessage={config.successMessage || t('settingsSavedSuccess')}
            removeText={t('remove')}
            saveText={t('save')}
            savingText={t('saving')}
            keySetText={config.keySetText || 'Value is set'}
            getMaskedValue={config.getMaskedValue}
            onToast={onToast}
          />

          {(config.helpText || config.helpLink) && (
            <div className="text-xs text-gray-500 mt-2">
              <p>
                {config.helpText}
                {config.helpLink && (
                  <a
                    href={config.helpLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-700 ml-1">
                    {config.helpLink.text}
                  </a>
                )}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SettingSection;
