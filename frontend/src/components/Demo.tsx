'use client';

import { useState } from 'react';
import DemoPRAnalysis from './DemoPRAnalysis';

// GitHubのPRページかどうかを判定する簡易的な関数
const isGitHubPRPage = (url: string) => {
  try {
    const urlObject = new URL(url);
    return urlObject.hostname === 'github.com' && urlObject.pathname.includes('/pull/');
  } catch {
    return false;
  }
};

const Demo = () => {
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // URL入力の検証
  const validateUrl = (url: string) => {
    const isValid = isGitHubPRPage(url);
    setIsValid(isValid);
    return isValid;
  };

  // URL入力ハンドラー
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPrUrl(newUrl);
    validateUrl(newUrl);
    setShowAnalysis(false); // 新しいURLが入力されたら分析結果を非表示に
  };

  // PRナビゲーションハンドラー
  const handleGoToPR = () => {
    if (!isValid) return;
    // ここでPR分析画面に遷移するロジックを実装
    console.log('Navigating to PR:', prUrl);
    setShowAnalysis(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">PR Checklistify Demo</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter a GitHub Pull Request URL to generate an AI-powered review checklist.
        </p>

        <div className="mb-6">
          <label htmlFor="pr-url" className="block text-sm font-medium text-gray-700 mb-1">
            GitHub PR URL
          </label>
          <div className="flex">
            <input
              type="text"
              id="pr-url"
              value={prUrl}
              onChange={handleUrlChange}
              placeholder="https://github.com/owner/repo/pull/123"
              className={`flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 ${
                prUrl && !isValid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <button
              onClick={handleGoToPR}
              disabled={!isValid}
              className={`px-4 py-2 rounded-r-md ${
                isValid ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}>
              Go
            </button>
          </div>
          {prUrl && !isValid && <p className="mt-1 text-sm text-red-500">Please enter a valid GitHub PR URL</p>}
        </div>
        {showAnalysis && <DemoPRAnalysis />}
      </div>
    </div>
  );
};

export default Demo;
