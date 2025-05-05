import GitHubTokenSettings from './GitHubTokenSettings';
import OpenAIKeySettings from './OpenAIKeySettings';
import LanguageSettings from './LanguageSettings';
import StorageManagement from './StorageManagement';

// Settings Panel component
const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <button
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <button
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <GitHubTokenSettings />
          <OpenAIKeySettings />
          <LanguageSettings />
          <StorageManagement />
        </div>
      </button>
    </button>
  );
};

export default SettingsPanel;
