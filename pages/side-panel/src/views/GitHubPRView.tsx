import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { usePRData } from '../hooks/usePRData';
import TokenSetupPrompt from '../components/TokenSetupPrompt';
import OpenAIKeySettings from '../components/OpenAIKeySettings';
import { githubTokenStorage, openaiApiKeyStorage } from '@extension/storage';
import { calculateReviewTime } from '../utils/prUtils';
import PRAnalysis from '../components/PRAnalysis';
import { useReward } from 'react-rewards';

const GitHubPRView = () => {
  const { owner, repo, prNumber } = useParams();
  const { currentURL } = useNavigation();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  const [showOpenAISetup, setShowOpenAISetup] = useState(false);
  const [previousApprovalPercentage, setPreviousApprovalPercentage] = useState<number | null>(null);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);
  const { reward: confettiReward } = useReward('confettiReward', 'confetti', {
    elementCount: 200,
    elementSize: 10,
    spread: 160,
  });

  // PRのURLを構築
  const url = currentURL || `https://github.com/${owner}/${repo}/pull/${prNumber}`;

  // 統合された状態管理フックを使用
  const { prData, isLoading, error: prError, analysisResult, saveAnalysisResult, refreshData } = usePRData();

  // トークンの確認
  useEffect(() => {
    const checkToken = async () => {
      const token = await githubTokenStorage.get();
      setHasToken(!!token);
    };

    const checkOpenAIKey = async () => {
      const key = await openaiApiKeyStorage.get();
      setHasOpenAIKey(!!key);
    };

    checkToken();
    checkOpenAIKey();
  }, []);

  // useEffect内でプロパティを設定
  useEffect(() => {
    if (hasToken === true && hasOpenAIKey === false && !prData) {
      setShowOpenAISetup(true);
    }
  }, [hasToken, hasOpenAIKey, prData]);

  // OpenAI APIキー設定完了時のハンドラー
  const handleOpenAIKeySetupComplete = async () => {
    setHasOpenAIKey(true);
    setShowOpenAISetup(false);
  };

  // ファイルごとの承認状況を計算する関数
  const getApprovedFiles = useCallback(() => {
    if (!prData || !analysisResult) return 0;

    return prData.files.filter(file => {
      const fileChecklist = analysisResult.fileChecklists.find(checklist => checklist.filename === file.filename);

      if (!fileChecklist) return false;

      // すべてのチェックリストアイテムが'OK'になっているか確認
      return fileChecklist.checklistItems.every(item => item.status === 'OK');
    }).length;
  }, [prData, analysisResult]);

  // 承認率を計算する関数 (0-100%)
  const getApprovalPercentage = useCallback(() => {
    if (!prData || prData.files.length === 0) return null;
    return (getApprovedFiles() / prData.files.length) * 100;
  }, [prData, getApprovedFiles]);

  const currentApprovalPercentage = getApprovalPercentage();

  // 承認率が変化したときのエフェクト
  useEffect(() => {
    // 承認率が100%に達したときに紙吹雪アニメーションをトリガー
    if (currentApprovalPercentage === 100 && previousApprovalPercentage !== null && previousApprovalPercentage < 100) {
      confettiReward();
      setShowCompleteMessage(true); // 追加: 完了メッセージを表示
    } else {
      setShowCompleteMessage(false); // 追加: 完了メッセージを非表示
      setPreviousApprovalPercentage(currentApprovalPercentage);
    }
  }, [currentApprovalPercentage, previousApprovalPercentage, confettiReward]);

  if (hasToken === null) {
    return <div className="flex items-center justify-center h-screen">Checking configuration...</div>;
  }

  if (hasToken === false) {
    return <TokenSetupPrompt onComplete={() => setHasToken(true)} />;
  }

  // OpenAI API Keyのセットアップ画面を表示（GitHubトークンあり、OpenAIキーなし、ユーザーが表示を選択）
  if (showOpenAISetup) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">OpenAI API Key Setup</h2>
          <p className="text-sm mb-4">
            Set up an OpenAI API key to enable AI-powered PR analysis features. This will help you get automated
            insights about this PR.
          </p>

          <div className="mb-4">
            <OpenAIKeySettings />
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setShowOpenAISetup(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm">
              Skip for now
            </button>
            <button
              onClick={handleOpenAIKeySetupComplete}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
              Continue to PR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading PR data...</div>;
  }

  if (prError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Failed to load PR data</p>
        <p className="text-sm">Current PR URL: {url}</p>
      </div>
    );
  }

  if (!prData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">No PR data available</p>
        <p className="text-sm">Current PR URL: {url}</p>
        <button
          onClick={() => refreshData()}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Refresh
        </button>
      </div>
    );
  }

  const { reviewTime } = { reviewTime: calculateReviewTime(prData) };

  return (
    <div className="App bg-slate-50">
      {/* 紙吹雪アニメーションを表示するための要素 */}
      <span id="confettiReward" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50" />

      {/* 完了メッセージの大きなアニメーション表示 */}
      {showCompleteMessage && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-40 pointer-events-none">
          <div className="complete-text text-6xl font-bold text-green-600 animate-fade-in-up animate-pulse-effect">
            COMPLETE
          </div>
        </div>
      )}

      <div className="review-progress fixed top-0 left-0 right-0 z-10 bg-white shadow-md p-2 border-b border-gray-300 mb-2">
        <h4 className="font-bold mb-1">Review Progress:</h4>
        <div className="flex justify-between mb-1 text-sm">
          <span>
            Approved: {getApprovedFiles()} /{prData.files.length} files
          </span>
          <span>Estimated review time: {reviewTime || 0} hours</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{
              width: `${getApprovalPercentage()}%`,
            }}></div>
        </div>
      </div>
      <header className="App-header text-gray-900 pt-16">
        <div className="w-full max-w-3xl px-4">
          <div className="pr-header mb-2">
            <h3 className="text-xl font-bold mb-1">{prData.title}</h3>
            <div className="flex items-center text-sm mb-1">
              <img src={prData.user.avatar_url} alt="User Avatar" className="w-6 h-6 rounded-full mr-2" />
              <span>{prData.user.login}</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <div>
                Created: <span className="font-semibold">{new Date(prData.created_at).toLocaleString()}</span>
                {prData.merged_at && (
                  <>
                    {' '}
                    | Merged: <span className="font-semibold">{new Date(prData.merged_at).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="stats flex justify-between mb-2 text-sm p-2 rounded bg-gray-100">
            <span className="text-green-600">+{prData.additions}</span>
            <span className="text-red-600">-{prData.deletions}</span>
            <span>{prData.changed_files} files</span>
          </div>

          {/* PRAnalysisコンポーネントを追加 - ファイル一覧の前に表示 */}
          <PRAnalysis
            prData={prData}
            url={url}
            analysisResult={analysisResult}
            saveAnalysisResult={saveAnalysisResult}
          />

          {/* 追加: 完了メッセージの表示 */}
          {showCompleteMessage && (
            <div className="complete-message p-4 mb-4 rounded bg-green-100 text-green-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m2.293-1.293a1 1 0 011.414 0l3.293 3.293a1 1 0 010 1.414l-9 9a1 1 0 01-1.414 0l-3.293-3.293a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                />
              </svg>
              All files approved! Review complete.
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default GitHubPRView;
