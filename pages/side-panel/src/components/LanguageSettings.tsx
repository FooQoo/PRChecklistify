import { useEffect, useState } from 'react';
import { languagePreferenceStorage } from '@extension/storage';

// Component for language preference settings
const LanguageSettings = () => {
  const [language, setLanguage] = useState('');
  const [savedLanguage, setSavedLanguage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load the saved language when component mounts
  useEffect(() => {
    const loadLanguage = async () => {
      const lang = await languagePreferenceStorage.get();
      setSavedLanguage(lang || navigator.language || 'en');
    };
    loadLanguage();
  }, []);

  const handleSaveLanguage = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      await languagePreferenceStorage.set(language);
      setSavedLanguage(language);
      setMessage({ text: 'Language preference saved successfully', type: 'success' });

      // Clear the selection after successful save
      setLanguage('');
    } catch (error) {
      console.error('Error saving language preference:', error);
      setMessage({ text: 'Failed to save language preference', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguageDisplay = (lang: string) => {
    if (lang.startsWith('ja')) return 'Japanese (日本語)';
    if (lang.startsWith('ko')) return 'Korean (한국어)';
    if (lang.startsWith('en')) return 'English';
    return lang;
  };

  return (
    <div className="border border-gray-300 rounded p-4 w-full mt-4">
      <h3 className="text-lg font-bold mb-3">Language Settings</h3>
      <div className="mb-4">
        <p className="text-sm mb-2">
          {savedLanguage
            ? 'Current language preference is set to: ' + getLanguageDisplay(savedLanguage)
            : 'Set your preferred language for AI-generated content.'}
        </p>

        <div className="flex">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="flex-grow p-2 border rounded-l text-sm">
            <option value="" disabled>
              {'Select language...'}
            </option>
            <option value="en">English</option>
            <option value="ja">Japanese (日本語)</option>
            <option value="ko">Korean (한국어)</option>
          </select>
          <button
            onClick={handleSaveLanguage}
            disabled={isSaving || !language}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-r text-sm disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message.text && (
          <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}

        <p className="text-xs text-gray-600 mt-3">
          {
            'When no preference is set, the system will use your browser language. Setting a preference will override this for all AI-generated content.'
          }
        </p>
      </div>
    </div>
  );
};

export default LanguageSettings;
