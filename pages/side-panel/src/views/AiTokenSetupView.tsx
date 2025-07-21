import { useState } from 'react';
import { UnifiedApiKeySetupView, Toast } from '../components';

const AiTokenSetupView: React.FC = () => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

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

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={handleCloseToast}
        duration={3000}
      />
      <UnifiedApiKeySetupView mode="setup" onToast={showToast} />
    </>
  );
};

export default AiTokenSetupView;
