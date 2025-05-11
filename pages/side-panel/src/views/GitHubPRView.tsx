import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { usePRData } from '../hooks/usePRData';
import TokenSetupPrompt from '../components/TokenSetupPrompt';
import OpenAIKeySettings from '../components/OpenAIKeySettings';
import { githubTokenStorage, openaiApiKeyStorage } from '@extension/storage';
import { calculateReviewTime } from '../utils/prUtils';
import PRAnalysis from '../components/PRAnalysis';
import FileChecklist from '../components/FileChecklist';
import type { ChecklistItemStatus } from '@src/types';

const GitHubPRView = () => {
  const { owner, repo, prNumber } = useParams();
  const { currentURL } = useNavigation();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  const [showOpenAISetup, setShowOpenAISetup] = useState(false);

  // PRのURLを構築
  const url = currentURL || `https://github.com/${owner}/${repo}/pull/${prNumber}`;

  // 統合された状態管理フックを使用
  const { prData, isLoading, error: prError, analysisResult, refreshData, saveAnalysisResult } = usePRData();

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

  // チェックリスト変更時のハンドラー
  const handleChecklistChange = (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => {
    if (!prData || !analysisResult) return;

    // 分析結果のファイルチェックリストを更新する
    const updatedFileChecklists = analysisResult.fileChecklists.map(checklist => {
      if (checklist.filename === filename) {
        // ステータスマッピングしたチェックリストアイテムを作成
        const updatedItems = checklist.checklistItems.map((item, index) => {
          const key = `item_${index}`;
          if (checklistItems[key]) {
            return { ...item, status: checklistItems[key] as ChecklistItemStatus };
          }
          return item;
        });
        return { ...checklist, checklistItems: updatedItems };
      }
      return checklist;
    });

    // 更新後の分析結果オブジェクトを作成
    const updatedAnalysisResult = {
      ...analysisResult,
      fileChecklists: updatedFileChecklists,
    };

    // 分析結果を更新
    saveAnalysisResult(updatedAnalysisResult);
  };

  // ファイルごとの承認状況を計算する関数
  const getApprovedFiles = () => {
    if (!prData || !analysisResult) return 0;

    return prData.files.filter(file => {
      const fileChecklist = analysisResult.fileChecklists.find(checklist => checklist.filename === file.filename);

      if (!fileChecklist) return false;

      // すべてのチェックリストアイテムが'OK'になっているか確認
      return fileChecklist.checklistItems.every(item => item.status === 'OK');
    }).length;
  };

  // 承認率を計算する関数 (0-100%)
  const getApprovalPercentage = () => {
    if (!prData || prData.files.length === 0) return 0;
    return (getApprovedFiles() / prData.files.length) * 100;
  };

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
          <PRAnalysis prData={prData} url={url} />

          {analysisResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              <div className="changed-files p-4 border border-gray-300 rounded-md mb-4 bg-white shadow-sm w-full text-left">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">Changed Files</h3>
                </div>

                <div className="detailed-checklists">
                  {prData.files.map((file, index) => {
                    // Find AI-generated checklist for this file if available
                    const aiGeneratedChecklist = analysisResult?.fileChecklists.find(
                      checklist => checklist.filename === file.filename,
                    );

                    return (
                      <FileChecklist
                        key={index}
                        file={file}
                        onChecklistChange={handleChecklistChange}
                        aiGeneratedChecklist={aiGeneratedChecklist}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default GitHubPRView;
