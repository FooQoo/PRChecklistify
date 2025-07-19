import { useState } from 'react';
import { useI18n } from '@extension/i18n';

export type TextInputProps = {
  label: string;
  value?: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  isLoading?: boolean;
  onSave: (value: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  successMessage?: string;
  removeText?: string;
  saveText?: string;
  savingText?: string;
  keySetText?: string;
  keyNotSetText?: string;
  getMaskedValue?: (value: string) => string;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
};

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  placeholder = '****',
  type = 'password',
  isLoading = false,
  onSave,
  onRemove,
  validator,
  errorMessage,
  successMessage,
  removeText,
  saveText,
  savingText,
  keySetText,
  keyNotSetText,
  getMaskedValue,
  onToast,
}) => {
  const { t } = useI18n();

  // i18nを使用してデフォルト値を設定
  const defaultErrorMessage = errorMessage || t('invalidFormat');
  const defaultSuccessMessage = successMessage || t('savedSuccessfully');
  const defaultRemoveText = removeText || t('remove');
  const defaultSaveText = saveText || t('save');
  const defaultSavingText = savingText || t('saving');
  const defaultKeySetText = keySetText || t('valueIsSet');
  const defaultKeyNotSetText = keyNotSetText || t('valueIsNotSet');
  const [inputValue, setInputValue] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);

  const loading = isLoading || internalLoading;

  const defaultGetMaskedValue = (key: string): string => {
    if (!key || key.length < 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const maskValue = getMaskedValue || defaultGetMaskedValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valueToSave = displayValue.trim();
    if (!valueToSave) {
      onToast?.(defaultErrorMessage, 'error');
      return;
    }

    if (validator && !validator(valueToSave)) {
      onToast?.(defaultErrorMessage, 'error');
      return;
    }

    try {
      setInternalLoading(true);
      await onSave(valueToSave);
      // パスワードタイプの場合のみ入力フィールドをクリア
      if (type === 'password') {
        setInputValue('');
      }
      onToast?.(defaultSuccessMessage, 'success');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      onToast?.(t('failedToSave'), 'error');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    try {
      setInternalLoading(true);
      await onRemove();
      setInputValue('');
      setHasUserInput(false);
      onToast?.(defaultRemoveText, 'success');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      onToast?.(t('failedToRemove'), 'error');
    } finally {
      setInternalLoading(false);
    }
  };

  const displayPlaceholder = value ? maskValue(value) : placeholder;

  // テキストタイプの場合は保存された値を入力フィールドに表示
  // ただし、ユーザーが一度でも入力した場合は inputValue を優先する
  const displayValue = hasUserInput ? inputValue : type === 'text' && value ? value : inputValue;

  // プレースホルダーの設定：ユーザーが入力中の場合は前回の保存済み値を表示
  const inputPlaceholder =
    hasUserInput && value
      ? type === 'text'
        ? value
        : displayPlaceholder
      : type === 'text'
        ? placeholder
        : displayPlaceholder;

  return (
    <div className="text-input">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <div className="flex">
            <input
              type={type}
              id="text-input"
              value={displayValue}
              onChange={e => {
                setInputValue(e.target.value);
                setHasUserInput(true);
              }}
              placeholder={inputPlaceholder}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:z-10 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !displayValue.trim()}
              className={`px-4 py-2 ${
                loading || !displayValue.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {loading ? defaultSavingText : defaultSaveText}
            </button>
          </div>
          {value && onRemove && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{defaultKeySetText}</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-400">
                {defaultRemoveText}
              </button>
            </div>
          )}
          {!value && (
            <div className="mt-1">
              <span className="text-xs text-gray-400">{defaultKeyNotSetText}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TextInput;
