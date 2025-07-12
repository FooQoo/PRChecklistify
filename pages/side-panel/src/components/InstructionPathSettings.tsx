import { useState } from 'react';
import { useI18n } from '@extension/i18n';
import { useInstructionPathAtom } from '../hooks/useInstructionPathAtom';
interface InstructionPathSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const InstructionPathSettings: React.FC<InstructionPathSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { path, setPathAndStorage, clearPath } = useInstructionPathAtom();
  const [inputPath, setInputPath] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPath.trim()) return;
    await setPathAndStorage(inputPath.trim());
    setInputPath('');
    onToast(t('settingsSavedSuccess'), 'success');
  };

  const handleClear = async () => {
    await clearPath();
    setInputPath('');
    onToast(t('remove'), 'success');
  };

  return (
    <div className="mb-4">
      <label htmlFor="instruction-path" className="block text-sm font-medium text-gray-700 mb-1">
        {t('instructionPath')}
      </label>
      <textarea
        id="instruction-path"
        value={inputPath}
        onChange={e => setInputPath(e.target.value)}
        placeholder={t('instructionPathPlaceholder')}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex space-x-2 mt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!inputPath.trim()}
          className={`px-4 py-2 ${!inputPath.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'} rounded-md`}>
          {t('save')}
        </button>
        {path && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md">
            {t('remove')}
          </button>
        )}
      </div>
    </div>
  );
};

export default InstructionPathSettings;
