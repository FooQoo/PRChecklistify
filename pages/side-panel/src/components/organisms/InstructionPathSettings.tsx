import { useI18n } from '@extension/i18n';
import { useInstructionPathAtom } from '../../hooks/useInstructionPathAtom';
import { TextInput } from '../molecules';

interface InstructionPathSettingsProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const InstructionPathSettings: React.FC<InstructionPathSettingsProps> = ({ onToast }) => {
  const { t } = useI18n();
  const { path, setPathAndStorage, clearPath } = useInstructionPathAtom();

  // ファイルパスのバリデーション（基本的なチェック）
  const validatePath = (filePath: string): boolean => {
    // 空文字は無効
    if (!filePath.trim()) return false;
    // 基本的なパス形式をチェック（より厳密なバリデーションが必要な場合は拡張）
    return true;
  };

  // パスの表示用（マスクは不要）
  const getDisplayPath = (filePath: string): string => {
    return filePath;
  };

  return (
    <div className="instruction-path-settings">
      <TextInput
        label={t('instructionPath')}
        value={path}
        placeholder={t('instructionPathPlaceholder')}
        type="text"
        onSave={setPathAndStorage}
        onRemove={clearPath}
        validator={validatePath}
        errorMessage={t('invalidPathFormat')}
        successMessage={t('settingsSavedSuccess')}
        removeText={t('remove')}
        saveText={t('save')}
        savingText={t('saving')}
        keySetText={t('pathIsSet')}
        getMaskedValue={getDisplayPath}
        onToast={onToast}
      />
    </div>
  );
};

export default InstructionPathSettings;
