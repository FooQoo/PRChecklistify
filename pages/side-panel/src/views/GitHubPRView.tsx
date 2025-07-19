import { useEffect, useRef } from 'react';
import { usePRData } from '../hooks/usePRData';
import { calculateReviewTime, getPrKey } from '../utils/prUtils';
import { PRAnalysis } from '../components';
import { useReward } from 'react-rewards';
import { useParams } from 'react-router-dom';

const GitHubPRView = () => {
  const { domain, owner, repo, prNumber } = useParams<{
    domain: string;
    owner: string;
    repo: string;
    prNumber: string;
  }>();

  const prKey = getPrKey(domain, owner, repo, prNumber);
  const { reward: confettiReward } = useReward('confettiReward', 'confetti', {
    elementCount: 200,
    elementSize: 10,
    spread: 160,
  });

  // PRキーの変更を検知するためのref
  const prevPrKeyRef = useRef<string | undefined>(undefined);

  // 統合された状態管理フックを使用
  const {
    prData,
    isLoading,
    error: prError,
    analysisResult,
    saveAnalysisResultSummary,
    saveAnalysisResultChecklist,
    refreshData,
    currentApprovalPercentage,
    approvedFilesCount,
    isJustCompleted,
  } = usePRData(prKey);

  // PRキーが変わったときにローディング状態をリセット
  useEffect(() => {
    if (prevPrKeyRef.current !== prKey) {
      // ここでローディング状態をリセットするためにリフレッシュを強制実行
      refreshData();
      prevPrKeyRef.current = prKey;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prKey]);

  // 完了時の紙吹雪エフェクトとメッセージ表示
  useEffect(() => {
    if (isJustCompleted) {
      confettiReward();
    }
  }, [isJustCompleted, confettiReward]);

  if (isLoading && !prData) {
    return <div className="flex items-center justify-center h-screen">Loading PR data...</div>;
  }

  if (prError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Failed to load PR data</p>
      </div>
    );
  }

  if (!prData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">No PR data available</p>
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
    <div key={prKey} className="App bg-slate-50">
      {/* 紙吹雪アニメーションを表示するための要素 */}
      <span id="confettiReward" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50" />

      {/* 完了メッセージの大きなアニメーション表示 */}
      <div
        className={`fixed top-0 left-0 w-full h-full flex items-center justify-center z-40 pointer-events-none transition-opacity duration-500 ${isJustCompleted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="complete-text text-6xl font-bold text-green-600 animate-fade-in-up animate-pulse-effect">
          COMPLETE
        </div>
      </div>

      <div className="review-progress fixed top-0 left-0 right-0 z-10 bg-white shadow-md p-2 border-b border-gray-300 mb-2">
        <h4 className="font-bold mb-1">Review Progress:</h4>
        <div className="flex justify-between mb-1 text-sm">
          <span>
            Approved: {approvedFilesCount}/{prData.files.length} files
          </span>
          <span>Estimated review time: {reviewTime || 0} hours</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{
              width: `${currentApprovalPercentage || 0}%`,
            }}></div>
        </div>
      </div>
      <header className="App-header text-gray-900 pt-16">
        <div className="w-full max-w-3xl px-4">
          <div className="pr-header mb-2">
            <h3 className="text-xl font-bold mb-1">
              <a
                href={prData.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-gray-700 hover:underline cursor-pointer inline-flex items-center">
                {prData.title}
                <svg
                  className="ml-1 h-4 w-4 text-gray-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </h3>
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
            analysisResult={analysisResult}
            refreshData={refreshData}
            saveAnalysisResultSummary={saveAnalysisResultSummary}
            saveAnalysisResultChecklist={saveAnalysisResultChecklist}
          />

          {/* 追加: 完了メッセージの表示 */}
          {currentApprovalPercentage === 100 && (
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
