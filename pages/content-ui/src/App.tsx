import { useEffect, useState } from 'react';
import { ToggleButton } from '@extension/ui';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    console.log('content ui loaded');
  }, []);

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
    // ここで設定パネルを表示するロジックを実装
    console.log('Settings button clicked');
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded bg-blue-100 px-2 py-1">
        <div className="flex gap-1 text-blue-500">
          Edit <strong className="text-blue-700">pages/content-ui/src/app.tsx</strong> and save to reload.
        </div>
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
      </div>

      {/* 固定表示する設定ボタン */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleSettingsClick}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center"
          aria-label="設定">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </>
  );
}
