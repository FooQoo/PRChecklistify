import { useEffect, useState, useCallback } from 'react';
import { atom, useAtom } from 'jotai';
import useSWR from 'swr';
import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { githubTokenStorage, openaiApiKeyStorage, languagePreferenceStorage } from '@extension/storage';
import { type PRAnalysisResult, createOpenAIClient, type FileChecklist } from '@extension/shared';
import OpenAIKeySettings from './components/OpenAIKeySettings';
import TokenSetupPrompt from './components/TokenSetupPrompt';
import SettingsPanel from './components/SettingsPanel';
import SettingsButton from './components/SettingsButton';

// Type for page information
type CurrentPage = {
  url: string;
};

// Type for saved PR data with review status
interface SavedPRData {
  prId: string; // Unique identifier for the PR
  timestamp: number; // When the data was saved
  prData: PRData; // The actual PR data with review statuses
  analysisResult?: PRAnalysisResult; // Optional AI analysis result
}

// GitHub PR data interface
interface PRData {
  title: string;
  description: string;
  diffStats: {
    additions: number;
    deletions: number;
    changedFiles: number;
  };
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
    comments?: string; // Any review comments for this file
    checklistItems?: Record<string, 'PENDING' | 'OK' | 'NG'>; // Dynamic checklist items with status values
  }[];
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  review_assigned_at: string | null; // レビューがアサインされた時間
  merged_at: string | null; // マージされた時間
  state: string; // PR の状態 (open, closed, merged)
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
}

// Create Jotai atom for PR data
const prDataAtom = atom<PRData | null>(null);

// Create Jotai atom for analysis result data
const analysisResultAtom = atom<PRAnalysisResult | null>(null);

// Create a derived atom that automatically saves to storage when updated
const prDataWithStorageAtom = atom(
  get => get(prDataAtom),
  (get, set, newValue: PRData | null, url?: string) => {
    // Set the base atom value
    set(prDataAtom, newValue);

    // If we have data and URL, save to storage
    if (newValue && url) {
      console.log('Auto-saving PR data to storage after state update...');
      // We're using setTimeout to make the storage operation non-blocking
      // This prevents UI jank while ensuring data is saved
      setTimeout(async () => {
        try {
          await prDataStorage.save(url, newValue);
          console.log('PR data auto-saved successfully');
        } catch (error) {
          console.error('Error auto-saving PR data to storage:', error);
        }
      }, 0);
    }
  },
);

// Create a derived atom for analysis result that automatically saves to storage when updated
const analysisResultWithStorageAtom = atom(
  // ゲッター: 現在の値を返す
  get => get(analysisResultAtom),
  // セッター: 値を更新し、ストレージにも保存
  (get, set, newValue: PRAnalysisResult | null, url?: string) => {
    // Set the base atom value
    set(analysisResultAtom, newValue);

    // If we have data and URL, save to storage
    if (newValue && url) {
      console.log('Auto-saving PR analysis result to storage after state update...');
      // We're using setTimeout to make the storage operation non-blocking
      setTimeout(async () => {
        try {
          // Save the analysis result along with existing PR data
          const prData = get(prDataAtom);
          if (prData) {
            // URLを指定して分析結果を保存
            await prDataStorage.save(url, prData, newValue);
            console.log('PR analysis result auto-saved successfully');
          } else {
            console.warn('Cannot save analysis result without PR data');
          }
        } catch (error) {
          console.error('Error auto-saving PR analysis result to storage:', error);
        }
      }, 0);
    }
  },
);

// Add SWR fetchers for use with useSWR
const fetchers = {
  // Fetcher for PR data from GitHub API
  fetchPR: async (key: string) => {
    const url = key.split('pr/')[1];

    console.log('Fetching PR data from API or storage:', key);

    // Try to load from storage first
    const savedData = await prDataStorage.load(url);
    if (savedData) {
      console.log('Loaded PR data from storage');
      return savedData;
    }

    // If no saved data, fetch from API
    console.log('No saved data found, fetching from API');
    return fetchPRData(url);
  },

  // Fetcher for PR analysis result from storage
  fetchAnalysis: async (key: string) => {
    const url = key.split('analysis/')[1];
    const savedAnalysis = await prDataStorage.loadAnalysis(url);

    if (savedAnalysis) {
      console.log('Loaded PR analysis from storage');
      return savedAnalysis;
    }

    return null;
  },

  // Fetcher for generating OpenAI analysis
  generateAnalysis: async (key: string, prData: PRData, language: string) => {
    console.log('Generating OpenAI analysis with SWR:', key);

    // ダミーの分析結果データを作成する関数
    const createDummyAnalysisResult = (): PRAnalysisResult => {
      return {
        summary: {
          background:
            'This PR implements a new feature that allows users to filter search results by various criteria.',
          problem: 'Users were having difficulty finding relevant items in large search result sets.',
          solution: 'Add filter controls that allow narrowing results by category, date, and other attributes.',
          implementation:
            'Implemented filter components in React with state management using Context API. Backend API was extended to support filter parameters.',
        },
        fileChecklists:
          prData?.files.map((file, index) => {
            return {
              // Use the filename as the key for checklist items
              filename: file.filename,
              checklistItems: [
                {
                  id: `${index}-1`,
                  description: `Code is well-formatted and consistent with project style in ${file.filename.split('/').pop()}`,
                  status: 'PENDING',
                },
                {
                  id: `${index}-2`,
                  description: `Implementation follows best practices for ${file.filename.includes('.ts') ? 'TypeScript' : file.filename.includes('.js') ? 'JavaScript' : 'this file type'}`,
                  status: 'PENDING',
                },
                {
                  id: `${index}-3`,
                  description: 'Documentation is clear and sufficient',
                  status: 'OK',
                },
                {
                  id: `${index}-4`,
                  description: 'Error handling is robust and appropriate',
                  status: 'PENDING',
                },
              ],
            };
          }) || [],
      };
    };

    try {
      // OpenAI APIコール（コメントアウト）
      /*
      // Create OpenAI client
      const openaiClient = await createOpenAIClient();
      if (!openaiClient) {
        throw new Error('OpenAI API key is not set');
      }

      // Use the selected language to generate analysis
      const result = await openaiClient.analyzePR(prData, language);
      return result;
      */

      // 実際の API 呼び出しをダミーデータに置き換え
      return createDummyAnalysisResult();
    } catch (error) {
      console.error('Error in generateAnalysis fetcher:', error);
      throw error;
    }
  },
};

// ストレージに保存するヘルパー関数
const savePRDataToStorage = async (data: PRData, url: string) => {
  try {
    console.log('Saving PR data to storage after checklist update...');
    console.log(
      'Files to save:',
      data.files.map(f => ({
        filename: f.filename,
        checklist: f.checklistItems,
      })),
    );

    await prDataStorage.save(url, data);
    console.log('PR data saved successfully');
  } catch (error) {
    console.error('Error saving PR data to storage:', error);
  }
};

// Service to fetch PR data from GitHub
const fetchPRData = async (prUrl: string): Promise<PRData | null> => {
  try {
    // Extract owner, repo, and PR number from URL
    const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return null;

    const [, owner, repo, prNumber] = match;

    console.log(`Fetching PR data for ${owner}/${repo}#${prNumber}`);

    // Get GitHub token if available
    const token = await githubTokenStorage.get();
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `token ${token}`;
      console.log('Using GitHub PAT for API requests');
    } else {
      console.log('No GitHub PAT found, API requests may be rate limited');
    }

    // Fetch PR data from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers,
    });

    if (!response.ok) {
      console.error('Failed to fetch PR data:', response.statusText);
      return null;
    }

    const prData = await response.json();

    // Get files changed in PR
    const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
      headers,
    });

    if (!filesResponse.ok) {
      console.error('Failed to fetch PR files:', filesResponse.statusText);
      return null;
    }

    const filesData = await filesResponse.json();

    // レビューデータを取得（レビューがアサインされた時間を特定するため）
    const reviewsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
      headers,
    });

    let reviewAssignedAt = null;

    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();

      // レビューが存在する場合、最初のレビューの時間をレビューアサイン時間として使用
      if (reviewsData && reviewsData.length > 0) {
        // レビューは時系列順に並んでいるため、最初のレビューの時間を使用
        reviewAssignedAt = reviewsData[0].submitted_at;
        console.log(`Review assigned at: ${reviewAssignedAt}`);
      } else {
        // レビューがまだない場合は、作成時間をレビューアサイン時間として使用
        reviewAssignedAt = prData.created_at;
        console.log(`No reviews found, using PR creation time: ${reviewAssignedAt}`);
      }
    } else {
      console.warn('Failed to fetch PR reviews:', reviewsResponse.statusText);
      // レビューデータを取得できない場合は、PRの作成時間を使用
      reviewAssignedAt = prData.created_at;
    }

    return {
      title: prData.title,
      description: prData.body || 'No description provided.',
      diffStats: {
        additions: prData.additions,
        deletions: prData.deletions,
        changedFiles: prData.changed_files,
      },
      files: filesData.map((file: any) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
        comments: '',
        checklistItems: {
          formatting: 'PENDING' as const,
          docs: 'PENDING' as const,
          tests: 'PENDING' as const,
          performance: 'PENDING' as const,
        },
      })),
      user: {
        login: prData.user.login,
        avatar_url: prData.user.avatar_url,
      },
      created_at: prData.created_at,
      updated_at: prData.updated_at,
      review_assigned_at: reviewAssignedAt,
      merged_at: prData.merged_at,
      state: prData.state,
      base: {
        ref: prData.base.ref,
      },
      head: {
        ref: prData.head.ref,
      },
    };
  } catch (error) {
    console.error('Error fetching PR data:', error);
    return null;
  }
};

// Helper functions for PR data storage
const prDataStorage = {
  // Save PR data to storage
  save: async (prUrl: string, prData: PRData, analysisResult?: PRAnalysisResult): Promise<void> => {
    try {
      // Create a unique ID for the PR (owner/repo/number)
      const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match) return;

      const [, owner, repo, prNumber] = match;
      const prId = `${owner}/${repo}/${prNumber}`;

      // Create the data object to save
      const savedData: SavedPRData = {
        prId,
        timestamp: Date.now(),
        prData,
        // Include analysisResult if provided
        ...(analysisResult && { analysisResult }),
      };

      // Save to storage with retry logic
      let retryCount = 0;
      const maxRetries = 3;

      const saveWithRetry = async (): Promise<void> => {
        try {
          // Save under the 'pr' key with the prId as property
          await chrome.storage.local.set({
            pr: {
              [prId]: savedData,
            },
          });
          console.log(`Saved PR data for ${prId} under 'pr' key`);
        } catch (error) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Retry attempt ${retryCount} for saving PR data for ${prId}`);
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait before retry
            return saveWithRetry();
          } else {
            throw error;
          }
        }
      };

      await saveWithRetry();
    } catch (error) {
      console.error('Error saving PR data:', error);
    }
  },

  // Load PR data from storage
  load: async (prUrl: string): Promise<PRData | null> => {
    try {
      // Create a unique ID for the PR
      const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match) return null;

      const [, owner, repo, prNumber] = match;
      const prId = `${owner}/${repo}/${prNumber}`;

      // Try to load from storage
      const result = await chrome.storage.local.get('pr');
      const prStorage = result.pr || {};
      const savedData = prStorage[prId] as SavedPRData | undefined;

      if (savedData && savedData.prData) {
        console.log(`Loaded saved PR data for ${prId} from ${new Date(savedData.timestamp).toLocaleString()}`);
        return savedData.prData;
      }

      return null;
    } catch (error) {
      console.error('Error loading PR data:', error);
      return null;
    }
  },

  // Load analysis result from storage
  loadAnalysis: async (prUrl: string): Promise<PRAnalysisResult | null> => {
    try {
      const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match) return null;

      const [, owner, repo, prNumber] = match;
      const prId = `${owner}/${repo}/${prNumber}`;

      // Try to load from storage
      const result = await chrome.storage.local.get('pr');
      const prStorage = result.pr || {};
      const savedData = prStorage[prId] as SavedPRData | undefined;

      if (savedData && savedData.analysisResult) {
        console.log(`Loaded saved PR analysis for ${prId}`);
        return savedData.analysisResult;
      }

      return null;
    } catch (error) {
      console.error('Error loading PR analysis:', error);
      return null;
    }
  },

  // Verify if data was saved correctly
  verify: async (prUrl: string): Promise<boolean> => {
    try {
      const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match) return false;

      const [, owner, repo, prNumber] = match;
      const prId = `${owner}/${repo}/${prNumber}`;

      // Check if data exists in storage
      const result = await chrome.storage.local.get('pr');
      const prStorage = result.pr || {};
      return !!prStorage[prId];
    } catch (error) {
      console.error('Error verifying PR data:', error);
      return false;
    }
  },
};

// レビュー時間を計算する関数（単位：時間）
const calculateReviewTime = (prData: PRData): number => {
  if (!prData.review_assigned_at) {
    return 0; // レビューがまだアサインされていない
  }

  const reviewStartTime = new Date(prData.review_assigned_at).getTime();
  let reviewEndTime: number;

  if (prData.merged_at) {
    // マージされている場合はマージされた時間を使用
    reviewEndTime = new Date(prData.merged_at).getTime();
  } else {
    // マージされていない場合は現在時刻を使用
    reviewEndTime = Date.now();
  }

  // 差分を時間単位で計算（ミリ秒→時間に変換）
  const diffInHours = (reviewEndTime - reviewStartTime) / (1000 * 60 * 60);
  return Math.round(diffInHours * 10) / 10; // 小数第1位まで表示
};

/**
 * カスタムフックでJotaiとSWRの状態管理を統合
 */
const usePRData = (url: string) => {
  // Jotai atoms
  const [, setPrData] = useAtom(prDataWithStorageAtom);
  const [, setAnalysisResult] = useAtom(analysisResultWithStorageAtom);

  // PR data with SWR
  const {
    data: prData,
    error: prError,
    mutate: mutatePrData,
  } = useSWR(`pr/${url}`, fetchers.fetchPR, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    onSuccess: data => {
      // SWRがデータを取得したらJotai atomにも同期
      if (data) {
        setPrData(data, url);
      }
    },
  });

  // Analysis data - using Jotai atom directly instead of SWR
  const [analysisResult] = useAtom(analysisResultWithStorageAtom);
  const analysisError = null; // No SWR error since we're not using SWR

  /**
   * 統合されたデータ更新関数
   * - SWRキャッシュを更新
   * - Jotaiステートを更新（ストレージへの保存も自動で行われる）
   */
  const updatePRData = (updatedData: PRData) => {
    // SWRキャッシュを更新（UIの即時更新）
    mutatePrData(updatedData, false);

    // Jotaiステートを更新（ストレージ保存）
    setPrData(updatedData, url);
  };

  /**
   * 統合された分析結果更新関数
   */
  const updateAnalysisResult = (updatedResult: PRAnalysisResult) => {
    setAnalysisResult(updatedResult, url);
  };

  return {
    prData,
    prError,
    analysisResult,
    analysisError,
    updatePRData,
    updateAnalysisResult,
  };
};

// Component for GitHub PR pages
const GitHubPRView = ({ url }: { url: string }) => {
  // 統合された状態管理フックを使用
  const { prData, prError, analysisResult, analysisError, updatePRData, updateAnalysisResult } = usePRData(url);

  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  // OpenAI API Key状態の追加
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  // 初期表示時にOpenAI APIキーの設定画面を表示するかどうか
  const [showOpenAISetup, setShowOpenAISetup] = useState(false);

  // Fetch PR data - first try to load from storage, then from API if needed
  useEffect(() => {
    const checkToken = async () => {
      const token = await githubTokenStorage.get();
      setHasToken(!!token);
    };

    const checkOpenAIKey = async () => {
      const key = await openaiApiKeyStorage.get();
      setHasOpenAIKey(!!key);
    };

    // GitHub Tokenとともに OpenAI API Keyもチェック
    checkToken();
    checkOpenAIKey();
  }, []);

  // useEffect内でプロパティを設定
  useEffect(() => {
    // GitHubトークンが設定されていて、OpenAIキーが設定されていない場合は
    // 初回表示時にOpenAI設定プロンプトを表示する
    if (hasToken === true && hasOpenAIKey === false && !prData) {
      setShowOpenAISetup(true);
    }
  }, [hasToken, hasOpenAIKey, prData]);

  // OpenAI APIキー設定完了時のハンドラー
  const handleOpenAIKeySetupComplete = async () => {
    // OpenAIキーが設定されたのでステートを更新
    setHasOpenAIKey(true);
    setShowOpenAISetup(false);
  };

  const handleFileCommentChange = (filename: string, comments: string) => {
    if (!prData) return;

    const updatedFiles = prData.files.map(file => {
      if (file.filename === filename) {
        return { ...file, comments };
      }
      return file;
    });

    // 統合された更新関数を使用
    updatePRData({ ...prData, files: updatedFiles });
  };

  // チェックリスト変更時も統合された更新関数を使用
  const handleChecklistChange = (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => {
    if (!prData) return;

    const updatedFiles = prData.files.map(file => {
      if (file.filename === filename) {
        return { ...file, checklistItems };
      }
      return file;
    });

    // 統合された関数で一度に更新
    updatePRData({ ...prData, files: updatedFiles });
  };

  // ファイルごとの承認状況を計算する関数
  const getApprovedFiles = () => {
    if (!prData) return 0;
    return prData.files.filter(f => {
      const checklistItems = f.checklistItems || {
        formatting: 'PENDING',
        docs: 'PENDING',
        tests: 'PENDING',
        performance: 'PENDING',
      };
      // ファイルが承認されるためには、すべての項目が'OK'になっている必要がある
      return Object.values(checklistItems).every(item => item === 'OK');
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

  if (loading) {
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

  if (analysisError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Failed to load analysis result</p>
        <p className="text-sm">Current PR URL: {url}</p>
      </div>
    );
  }

  // console.warn(JSON.stringify(prData?.files));
  console.warn(JSON.stringify(analysisResult));

  return (
    <div className="App bg-slate-50">
      {prData && (
        <div className="review-progress fixed top-0 left-0 right-0 z-10 bg-white shadow-md p-2 border-b border-gray-300 mb-2">
          <h4 className="font-bold mb-1">Review Progress:</h4>
          <div className="flex justify-between mb-1 text-sm">
            <span>
              Approved: {getApprovedFiles()} /{prData.files.length} files
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{
                width: `${getApprovalPercentage()}%`,
              }}></div>
          </div>
        </div>
      )}
      <header className="App-header text-gray-900 pt-16">
        {' '}
        {/* Added padding-top to make space for the fixed header */}
        {prData ? (
          <div className="w-full max-w-3xl px-4">
            <div className="pr-header mb-2">
              <h3 className="text-xl font-bold mb-1">{prData.title}</h3>
              <div className="flex items-center text-sm mb-1">
                <img src={prData.user.avatar_url} alt="User Avatar" className="w-6 h-6 rounded-full mr-2" />
                <span>{prData.user.login}</span>
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {prData.review_assigned_at && (
                  <div>
                    Review Time: <span className="font-semibold">{calculateReviewTime(prData)} hours</span>
                    {prData.merged_at ? ' (Completed)' : ' (In Progress)'}
                  </div>
                )}
              </div>
            </div>

            <div className="stats flex justify-between mb-2 text-sm p-2 rounded bg-gray-100">
              <span className="text-green-600">+{prData.diffStats.additions}</span>
              <span className="text-red-600">-{prData.diffStats.deletions}</span>
              <span>{prData.diffStats.changedFiles} files</span>
            </div>

            {/* PRAnalysisコンポーネントを追加 - ファイル一覧の前に表示 */}
            {prData && <PRAnalysis prData={prData} url={url} />}

            {analysisResult && (
              // <div className="analysis-result border border-gray-300 rounded p-2 w-full text-left mb-4">
              //   <h4 className="font-bold mb-1">AI Analysis Result:</h4>
              //   <div className="markdown-content">
              //     <p>{analysisResult.summary}</p>
              //   </div>
              // </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                {/* <div className="description border border-gray-300 rounded p-2 w-full text-left text-sm">
                <h4 className="font-bold mb-1">Description:</h4>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{prData.description}</ReactMarkdown>
                </div>
              </div> */}

                <div className="files-section border border-gray-300 rounded p-2 w-full text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold">Changed Files:</h4>
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
                          onCommentChange={handleFileCommentChange}
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
        ) : (
          <p className="text-red-500">Failed to load PR data. Please check your connection or PR URL.</p>
        )}
      </header>
    </div>
  );
};

// Component for non-GitHub PR pages
const DefaultView = () => {
  return (
    <div className="App bg-slate-50">
      <header className="App-header text-gray-900">
        <h2>PR Checklistify</h2>
        <p className="mb-4">Navigate to a GitHub PR to see the checklist.</p>
        <p className="text-sm mb-3">
          Edit <code>pages/side-panel/src/SidePanel.tsx</code> to customize.
        </p>
      </header>
    </div>
  );
};
interface FileChecklistProps {
  file: PRData['files'][0];
  onCommentChange: (filename: string, comments: string) => void;
  onChecklistChange: (filename: string, checklistItems: Record<string, 'PENDING' | 'OK' | 'NG'>) => void;
  aiGeneratedChecklist?: FileChecklist; // Added prop for AI-generated checklist
}

// New component for individual checklist items
interface ChecklistItemProps {
  label: string;
  status: 'PENDING' | 'OK' | 'NG';
  onToggle: () => void;
  className?: string;
}

const ChecklistItem = ({ label, status, onToggle, className = '' }: ChecklistItemProps) => {
  // Get the appropriate button style based on current state
  const getButtonStyle = (state: 'PENDING' | 'OK' | 'NG') => {
    switch (state) {
      case 'OK':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'NG':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'PENDING':
      default:
        return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
    }
  };

  // Render the button content
  const renderButtonContent = (state: 'PENDING' | 'OK' | 'NG') => {
    if (state === 'PENDING') {
      return 'PENDING';
    }
    return state;
  };

  // Get button class with fixed width
  const getButtonClasses = (state: 'PENDING' | 'OK' | 'NG') => {
    return `px-3 py-1 rounded-md text-sm font-medium transition-colors min-w-[90px] text-center ${getButtonStyle(state)}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={e => {
          e.stopPropagation(); // Prevent event propagation to parent elements
          onToggle();
        }}
        className={getButtonClasses(status)}>
        {renderButtonContent(status)}
      </button>
      <label className="text-sm">{label}</label>
    </div>
  );
};

const FileChecklist = ({ file, onChecklistChange, aiGeneratedChecklist }: FileChecklistProps) => {
  // Prepare a dynamic object based on AI-generated checklist if available
  const initializeChecklistItems = useCallback(() => {
    // If we already have checklist items saved from before, use those
    if (file.checklistItems && Object.keys(file.checklistItems).length > 0) {
      return file.checklistItems;
    }

    // If we have AI-generated checklist, create an object with those items
    if (aiGeneratedChecklist && aiGeneratedChecklist.checklistItems.length > 0) {
      const items: Record<string, 'PENDING' | 'OK' | 'NG'> = {};
      aiGeneratedChecklist.checklistItems.forEach((item, index) => {
        items[`item_${index}`] = item.status;
      });
      return items;
    }

    // 空の場合はプレースホルダーとして1つの'OK'ステータスのアイテムを作成
    return { item_0: 'OK' } as Record<string, 'PENDING' | 'OK' | 'NG'>;
  }, [file.checklistItems, aiGeneratedChecklist]);

  // State to track checklist items - Initialize from saved data if available
  const [checklistItems, setChecklistItems] =
    useState<Record<string, 'PENDING' | 'OK' | 'NG'>>(initializeChecklistItems());

  // Override to force expanded state (when user clicks to manually open/close)
  const [expandOverride, setExpandOverride] = useState<boolean | null>(null);
  // Track if all items were just checked to trigger auto-collapse
  const [allItemsJustChecked, setAllItemsJustChecked] = useState(false);

  // Initialize the allItemsJustChecked state based on initial checklist items
  useEffect(() => {
    const initialItems = initializeChecklistItems();
    const allInitialItemsOK = Object.values(initialItems).every(item => item === 'OK');
    setAllItemsJustChecked(allInitialItemsOK);
  }, [initializeChecklistItems]);

  // Calculate review status directly from checklist items
  const getReviewStatus = (): 'approved' | 'reviewing' | 'not-reviewed' => {
    if (!checklistItems || Object.keys(checklistItems).length === 0) {
      return 'not-reviewed';
    }

    const allOK = Object.values(checklistItems).every(item => item === 'OK');
    const anyReviewed = Object.values(checklistItems).some(item => item !== 'PENDING');

    if (allOK) {
      return 'approved';
    } else if (anyReviewed) {
      return 'reviewing';
    } else {
      return 'not-reviewed';
    }
  };

  // Calculate if expanded based on checklist state
  const getCalculatedExpandedState = (): boolean => {
    // If user has explicitly set expand state via override, use that
    if (expandOverride !== null) {
      return expandOverride;
    }

    // If there are no checklist items yet, keep expanded
    if (!checklistItems || Object.keys(checklistItems).length === 0) {
      return true;
    }

    const allOK = Object.values(checklistItems).every(item => item === 'OK');

    // If all checks are OK, collapse it
    if (allOK && allItemsJustChecked) {
      return false;
    }

    // Not reviewed items should be expanded by default
    if (getReviewStatus() === 'not-reviewed') {
      return true;
    }

    // In progress items should be expanded
    if (getReviewStatus() === 'reviewing') {
      return true;
    }

    return false; // Approved items default to collapsed
  };

  // Computed expanded state
  const expanded = getCalculatedExpandedState();

  // Update review status whenever checklist items change
  useEffect(() => {
    // Only update if we have checklist items
    if (checklistItems && Object.keys(checklistItems).length > 0) {
      // Update the checklistItems in the parent component
      console.log(`Updating checklist for file: ${file.filename}`, checklistItems);
      onChecklistChange(file.filename, checklistItems);

      // Check if all items just became OK
      const allOK = Object.values(checklistItems).every(item => item === 'OK');
      if (allOK && !allItemsJustChecked) {
        setAllItemsJustChecked(true);
        // Reset the override when items are all OK
        setExpandOverride(null);
      } else if (!allOK) {
        setAllItemsJustChecked(false);
      }
    }
  }, [checklistItems, file.filename, onChecklistChange, allItemsJustChecked]);

  // Toggle through the review states: PENDING -> NG -> OK -> NG
  const toggleReviewState = (item: string) => {
    console.log(`Toggling review state for '${item}' in file: ${file.filename}`);

    if (!checklistItems) return;

    const currentState = checklistItems[item];
    let nextState: 'PENDING' | 'OK' | 'NG';

    // PENDING -> NG -> OK -> NG cycle
    if (currentState === 'PENDING') {
      nextState = 'NG';
    } else if (currentState === 'NG') {
      nextState = 'OK';
    } else if (currentState === 'OK') {
      nextState = 'NG';
    } else {
      nextState = 'NG'; // fallback case, though it shouldn't happen
    }

    const newChecklistItems = {
      ...checklistItems,
      [item]: nextState,
    };

    // 変更を即座に適用
    setChecklistItems(newChecklistItems);

    // useEffectを待たずに親コンポーネントに即座に通知
    onChecklistChange(file.filename, newChecklistItems);
  };

  // Toggle expanded state manually
  const toggleExpanded = () => {
    // タブを閉じる操作の場合
    if (expanded) {
      // If we have checklist items, set them all to OK
      if (checklistItems && Object.keys(checklistItems).length > 0) {
        const allOKItems: Record<string, 'PENDING' | 'OK' | 'NG'> = {};

        // Set all items to OK
        Object.keys(checklistItems).forEach(key => {
          allOKItems[key] = 'OK';
        });

        // チェックリストを全てOKに変更
        setChecklistItems(allOKItems);

        // 親コンポーネントに変更を通知
        onChecklistChange(file.filename, allOKItems);
      }

      // 閉じる
      setExpandOverride(false);
    } else {
      // タブを開く操作の場合は通常通り開くだけ
      setExpandOverride(true);
    }
  };

  // Get status label and style based on calculated status
  const getStatusDisplay = () => {
    const currentStatus = getReviewStatus();

    switch (currentStatus) {
      case 'approved':
        return { label: '✓ Approved', class: 'bg-green-500 text-white' };
      case 'reviewing':
        return { label: '⚠ Reviewing', class: 'bg-yellow-500 text-white' };
      case 'not-reviewed':
      default:
        return { label: '⊘ Not Reviewed', class: 'bg-gray-500 text-white' };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Parse the patch to create a GitHub-like diff display
  const renderGitHubStyleDiff = (patch: string) => {
    if (!patch) return null;

    // Split the patch into lines
    const lines = patch.split('\n');

    return (
      <div className="text-xs border rounded overflow-hidden">
        {/* File header bar */}
        <div className="flex justify-between items-center bg-gray-100 p-2 border-b">
          <span className="font-mono font-medium">{file.filename}</span>
          <div className="flex items-center">
            <span className="text-green-600 mr-2">+{file.additions}</span>
            <span className="text-red-600">-{file.deletions}</span>
          </div>
        </div>

        {/* Diff content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, index) => {
                // Determine line type
                let lineClass = '';
                let prefix = '';

                if (line.startsWith('+')) {
                  lineClass = 'bg-green-50';
                  prefix = '+';
                } else if (line.startsWith('-')) {
                  lineClass = 'bg-red-50';
                  prefix = '-';
                } else if (line.startsWith('@')) {
                  lineClass = 'bg-blue-100';
                  prefix = '';
                } else {
                  prefix = ' ';
                }

                return (
                  <tr key={index} className={lineClass}>
                    <td className="py-0 px-2 select-none text-gray-500 border-r w-12 text-right">{index + 1}</td>
                    <td className="py-0 px-2 select-none text-gray-500 w-6 text-center font-mono">{prefix}</td>
                    <td className="py-0 px-2 whitespace-pre font-mono">{line.substring(prefix === '' ? 0 : 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
      <button
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50"
        onClick={toggleExpanded}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}>
        <div className="flex items-center max-w-[70%]">
          <span
            className={`inline-block flex-shrink-0 w-5 text-center mr-2 ${
              file.status === 'added'
                ? 'text-green-500'
                : file.status === 'removed'
                  ? 'text-red-500'
                  : 'text-yellow-500'
            }`}>
            {file.status === 'added' ? 'A' : file.status === 'removed' ? 'D' : 'M'}
          </span>
          <span className="font-medium text-xs break-all line-clamp-2">{file.filename}</span>
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
          <span className={`px-2 py-0.5 text-xs rounded-full mr-2 ${statusDisplay.class}`}>{statusDisplay.label}</span>
          <span className="text-gray-500">
            {expanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">AI-Generated Checklist</h4>

              {aiGeneratedChecklist ? (
                <div className="space-y-2">
                  {aiGeneratedChecklist.checklistItems.map((item, index) => (
                    <ChecklistItem
                      key={item.id}
                      label={item.description}
                      status={checklistItems[`item_${index}`] || item.status}
                      onToggle={() => {
                        // Toggle the status in a circular manner: PENDING -> NG -> OK -> NG
                        const itemKey = `item_${index}`;
                        toggleReviewState(itemKey);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <ChecklistItem
                    key={'ai-checklist-placeholder'}
                    label={'指摘事項なし'}
                    status={checklistItems[`item_0`] || 'OK'}
                    onToggle={() => {}}
                  />
                </div>
              )}
            </div>

            {file.patch && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Code Changes</h4>
                {renderGitHubStyleDiff(file.patch)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// PRAnalysis component for OpenAI-powered PR analysis
const PRAnalysis = ({ prData, url }: { prData: PRData; url: string }) => {
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  const [analysisResult, setAnalysisResult] = useAtom(analysisResultWithStorageAtom);
  const [isLoading, setIsLoading] = useState(false);

  // Check if OpenAI API key is set
  useEffect(() => {
    const checkOpenAIKey = async () => {
      const apiKey = await openaiApiKeyStorage.get();
      setHasOpenAIKey(!!apiKey);
    };

    checkOpenAIKey();
  }, []);

  // Load analysis result when component mounts
  useEffect(() => {
    const initialize = async () => {
      // 新しい初期化関数を使用してatomを初期化
      await initializeAtoms(url);
    };

    initialize();
  }, [url]);

  // Reset checklist status function
  const resetChecklistStatus = async () => {
    if (prData) {
      const updatedFiles = prData.files.map(file => {
        // If file has checklistItems, reset all their status to 'PENDING'
        if (file.checklistItems) {
          const resetChecklistItems: Record<string, 'PENDING' | 'OK' | 'NG'> = {};
          Object.keys(file.checklistItems).forEach(key => {
            resetChecklistItems[key] = 'PENDING';
          });
          return { ...file, checklistItems: resetChecklistItems };
        }
        return file;
      });

      // Update the PR data with reset status values
      const updatedPRData = { ...prData, files: updatedFiles };

      // Save the updated data to storage
      await savePRDataToStorage(updatedPRData, url);
      console.log('Reset all file statuses to PENDING for regeneration');
    }
  };

  // Generate PR checklist using SWR mutation
  const handleGeneratePRChecklist = async () => {
    // Set loading state to true
    setIsLoading(true);

    try {
      // Reset all file statuses before generating
      await resetChecklistStatus();

      // Create a new analysis and update the cache
      const newAnalysis = await fetchers.generateAnalysis(`analysis/${url}`, prData, 'en');

      // Also update Jotai state
      setAnalysisResult(newAnalysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
    } finally {
      // Set loading state back to false when done
      setIsLoading(false);
    }
  };

  if (hasOpenAIKey === null) {
    return <div className="mt-4 p-4 border border-gray-300 rounded">Loading OpenAI configuration...</div>;
  }

  if (hasOpenAIKey === false) {
    return (
      <div className="mt-4 p-4 border border-gray-300 rounded">
        <h3 className="font-bold text-lg mb-2">AI-Powered PR Analysis</h3>
        <p className="text-sm mb-3">To use AI-powered PR analysis, please set your OpenAI API key in the settings.</p>
        <button
          onClick={() => window.open(chrome.runtime.getURL('side-panel.html') + '?settings=true', '_blank')}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
          Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border border-gray-300 rounded">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-left">AI-Powered PR Analysis</h3>
        {analysisResult && !isLoading && (
          <button
            onClick={handleGeneratePRChecklist}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
            Regenerate Analysis
          </button>
        )}
      </div>

      {!analysisResult && !isLoading && (
        <div className="mb-4">
          <p className="text-sm mb-3">
            Generate an AI-powered analysis of this PR to get detailed descriptions and customized checklists for each
            file.
          </p>

          <button
            onClick={handleGeneratePRChecklist}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            Generate Analysis
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-sm text-gray-600">Analyzing PR with AI, this may take a moment...</p>
        </div>
      )}

      {analysisResult && !isLoading && (
        <div className="analysis-result text-left">
          <div className="mb-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="mb-2">
                <span className="font-semibold">Background:</span>
                <p className="mt-1">{analysisResult.summary.background}</p>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Problem:</span>
                <p className="mt-1">{analysisResult.summary.problem}</p>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Solution:</span>
                <p className="mt-1">{analysisResult.summary.solution}</p>
              </div>
              <div>
                <span className="font-semibold">Implementation:</span>
                <p className="mt-1">{analysisResult.summary.implementation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidePanel = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Function to get current page information from storage
    const getCurrentPage = async () => {
      setLoading(true);
      try {
        const result = await chrome.storage.local.get('currentPage');
        setCurrentPage(result.currentPage || { isPRPage: false, url: '' });
      } catch (error) {
        console.error('Error getting current page:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get initial state
    getCurrentPage();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      console.log('Storage changes:', changes);
      if (changes.currentPage) {
        setCurrentPage(changes.currentPage.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const isGitHubPRPage = (url: string) => {
    const githubPRRegex = /https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;
    return githubPRRegex.test(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <SettingsButton onClick={() => setShowSettings(true)} />

      {!currentPage || !currentPage.url ? (
        <DefaultView />
      ) : isGitHubPRPage(currentPage.url) ? (
        <GitHubPRView url={currentPage.url} />
      ) : (
        <DefaultView />
      )}
    </>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
