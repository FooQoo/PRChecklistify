import { useState } from 'react';

export type SecretKeyInputProps = {
  label: string;
  value?: string;
  placeholder?: string;
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
  getMaskedValue?: (value: string) => string;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
};

const SecretKeyInput: React.FC<SecretKeyInputProps> = ({
  label,
  value,
  placeholder = '****',
  isLoading = false,
  onSave,
  onRemove,
  validator,
  errorMessage = 'Invalid format',
  successMessage = 'Saved successfully',
  removeText = 'Remove',
  saveText = 'Save',
  savingText = 'Saving...',
  keySetText = 'Key is set',
  getMaskedValue,
  onToast,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = isLoading || internalLoading;

  const defaultGetMaskedValue = (key: string): string => {
    if (!key || key.length < 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const maskValue = getMaskedValue || defaultGetMaskedValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      onToast?.(errorMessage, 'error');
      return;
    }

    if (validator && !validator(inputValue)) {
      onToast?.(errorMessage, 'error');
      return;
    }

    try {
      setInternalLoading(true);
      await onSave(inputValue);
      setInputValue('');
      onToast?.(successMessage, 'success');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      onToast?.('Failed to save', 'error');
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
      onToast?.(removeText, 'success');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      onToast?.('Failed to remove', 'error');
    } finally {
      setInternalLoading(false);
    }
  };

  const displayPlaceholder = value ? maskValue(value) : placeholder;

  return (
    <div className="secret-key-input">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="secret-key" className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <div className="flex">
            <input
              type="password"
              id="secret-key"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={displayPlaceholder}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:z-10 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className={`px-4 py-2 ${
                loading || !inputValue.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } rounded-r-md`}>
              {loading ? savingText : saveText}
            </button>
          </div>
          {value && onRemove && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{keySetText}</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-400">
                {removeText}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SecretKeyInput;
