import { useEffect, useState } from 'react';
import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { githubTokenStorage } from '@extension/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Type for page information
type CurrentPage = {
  url: string;
};

// Type for saved PR data with review status
interface SavedPRData {
  prId: string; // Unique identifier for the PR
  timestamp: number; // When the data was saved
  prData: PRData; // The actual PR data with review statuses
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
    checklistItems?: {
      formatting: boolean;
      docs: boolean;
      tests: boolean;
      performance: boolean;
    }; // Checklist items for this file
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
      files: filesData.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
        comments: '',
        checklistItems: {
          formatting: false,
          docs: false,
          tests: false,
          performance: false,
        }, // Initialize checklist items
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
  save: async (prUrl: string, prData: PRData): Promise<void> => {
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
      };

      // Save to storage with retry logic
      let retryCount = 0;
      const maxRetries = 3;

      const saveWithRetry = async (): Promise<void> => {
        try {
          await chrome.storage.local.set({ [prId]: savedData });
          console.log(`Saved PR data for ${prId}`);
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
      const result = await chrome.storage.local.get(prId);
      const savedData = result[prId] as SavedPRData | undefined;

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

  // Verify if data was saved correctly
  verify: async (prUrl: string): Promise<boolean> => {
    try {
      const match = prUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (!match) return false;

      const [, owner, repo, prNumber] = match;
      const prId = `${owner}/${repo}/${prNumber}`;

      // Check if data exists in storage
      const result = await chrome.storage.local.get(prId);
      return !!result[prId];
    } catch (error) {
      console.error('Error verifying PR data:', error);
      return false;
    }
  },
};

// Format date to a more readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
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

// Component for GitHub token setup prompt
const TokenSetupPrompt = ({ onComplete }: { onComplete: () => void }) => {
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSaveToken = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      await githubTokenStorage.set(token);
      setMessage({ text: 'Token saved successfully', type: 'success' });

      // Wait a moment to show success message before proceeding
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error saving token:', error);
      setMessage({ text: 'Failed to save token', type: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">GitHub Token Required</h2>

        <p className="text-sm mb-4">
          A GitHub Personal Access Token (PAT) is required to access PR data. This helps with API rate limits and allows
          access to private repositories.
        </p>

        <div className="mb-4 border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 text-xs">
          <p className="mb-1 font-semibold">How to create a GitHub PAT:</p>
          <ol className="list-decimal ml-4">
            <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
            <li>
              Generate a new token with at least <code>repo</code> scope
            </li>
            <li>Copy and paste the token below</li>
          </ol>
        </div>

        <div className="mb-4">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter GitHub PAT..."
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSaveToken}
            disabled={isSaving || !token}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 flex-grow">
            {isSaving ? 'Saving...' : 'Save Token'}
          </button>
        </div>

        {message.text && (
          <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

// Component for GitHub PR pages
const GitHubPRView = ({ url }: { url: string }) => {
  const [prData, setPRData] = useState<PRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  // ステート更新トリガーの追加（プログレスバー更新用）
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch PR data - first try to load from storage, then from API if needed
  useEffect(() => {
    const checkToken = async () => {
      const token = await githubTokenStorage.get();
      setHasToken(!!token);
    };

    checkToken();
  }, []);

  useEffect(() => {
    // Only fetch PR data if we have a token
    if (hasToken === true) {
      const getPRData = async () => {
        setLoading(true);
        setError(null);

        try {
          // First try to load from storage
          const savedData = await prDataStorage.load(url);
          if (savedData) {
            console.log('Loaded PR data from storage');
            // チェックリストが未定義の場合は初期化
            const normalizedFiles = savedData.files.map(f => {
              if (!f.checklistItems) {
                return {
                  ...f,
                  checklistItems: {
                    formatting: false,
                    docs: false,
                    tests: false,
                    performance: false,
                  },
                };
              }
              return f;
            });

            // 正規化されたデータを設定
            setPRData({
              ...savedData,
              files: normalizedFiles,
            });
            setLoading(false);
            return;
          }

          // If no saved data, fetch from API
          console.log('No saved data found, fetching from API');
          const data = await fetchPRData(url);
          if (data) {
            // 全てのファイルにチェックリストアイテムが確実に初期化されていることを確認
            const normalizedFiles = data.files.map((f, index) => {
              console.log(`Initializing file ${index}: ${f.filename}`);
              if (!f.checklistItems) {
                return {
                  ...f,
                  checklistItems: {
                    formatting: false,
                    docs: false,
                    tests: false,
                    performance: false,
                  },
                };
              }
              return f;
            });

            const updatedPRData = {
              ...data,
              files: normalizedFiles,
            };

            // First set the state
            setPRData(updatedPRData);

            // Then explicitly save the initial data to storage with verification
            try {
              console.log('Saving initial PR data to storage...');
              await prDataStorage.save(url, updatedPRData);

              // Verify the data was saved correctly
              const saved = await prDataStorage.verify(url);
              if (saved) {
                console.log('Initial PR data saved and verified successfully');
              } else {
                console.warn('Initial PR data may not have saved correctly, retrying...');
                // Retry saving after a delay
                setTimeout(async () => {
                  await prDataStorage.save(url, updatedPRData);
                }, 500);
              }
            } catch (saveError) {
              console.error('Error saving initial PR data:', saveError);
            }
          } else {
            setError('Failed to retrieve PR data');
          }
        } catch (err) {
          console.error('Error in fetching PR data:', err);
          setError('An error occurred while fetching PR data');
        } finally {
          setLoading(false);
        }
      };

      getPRData();
    } else if (hasToken === false) {
      // If token is explicitly falsy (not null which means still loading)
      setLoading(false);
    }
  }, [url, hasToken]);

  // Save PR data whenever it changes
  useEffect(() => {
    if (prData) {
      const saveData = async () => {
        await prDataStorage.save(url, prData);
      };
      saveData();
    }
  }, [prData, url]);

  const handleFileCommentChange = (filename: string, comments: string) => {
    if (!prData) return;

    const updatedFiles = prData.files.map(file => {
      if (file.filename === filename) {
        return { ...file, comments };
      }
      return file;
    });

    setPRData({ ...prData, files: updatedFiles });
  };

  // Add handleChecklistChange function to update checklist items
  const handleChecklistChange = (filename: string, checklistItems: Record<string, boolean>) => {
    if (!prData) return;

    const updatedFiles = prData.files.map(file => {
      if (file.filename === filename) {
        return { ...file, checklistItems };
      }
      return file;
    });

    // 更新されたPRデータ
    const updatedPRData = { ...prData, files: updatedFiles };

    // ステートを更新
    setPRData(updatedPRData);

    // プログレスバー表示を更新するためのトリガー
    setRefreshTrigger(prev => prev + 1);

    // 明示的にストレージに保存（非同期で）
    savePRDataToStorage(updatedPRData);
  };

  // ストレージに保存するヘルパー関数
  const savePRDataToStorage = async (data: PRData) => {
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

  // ファイルごとの承認状況を計算する関数
  const getApprovedFiles = () => {
    if (!prData) return 0;
    return prData.files.filter(f => {
      const checklistItems = f.checklistItems || {
        formatting: false,
        docs: false,
        tests: false,
        performance: false,
      };
      return Object.values(checklistItems).every(item => item === true);
    }).length;
  };

  // 進行中ファイル数を計算する関数
  const getInProgressFiles = () => {
    if (!prData) return 0;
    return prData.files.filter(f => {
      const checklistItems = f.checklistItems || {
        formatting: false,
        docs: false,
        tests: false,
        performance: false,
      };
      const allChecked = Object.values(checklistItems).every(item => item === true);
      const anyChecked = Object.values(checklistItems).some(item => item === true);
      return anyChecked && !allChecked;
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading PR data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-sm">Current PR URL: {url}</p>
      </div>
    );
  }

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="description border border-gray-300 rounded p-2 w-full text-left text-sm">
                <h4 className="font-bold mb-1">Description:</h4>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                    {prData.description}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="files-section border border-gray-300 rounded p-2 w-full text-left">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold">Changed Files:</h4>
                </div>

                <div className="detailed-checklists">
                  {prData.files.map((file, index) => (
                    <FileChecklist
                      key={index}
                      file={file}
                      onCommentChange={handleFileCommentChange}
                      onChecklistChange={handleChecklistChange}
                    />
                  ))}
                </div>
              </div>
            </div>
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

// Component for GitHub token settings
const GitHubTokenSettings = () => {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load the saved token when component mounts
  useEffect(() => {
    const loadToken = async () => {
      const token = await githubTokenStorage.get();
      setSavedToken(token);
    };
    loadToken();
  }, []);

  const handleSaveToken = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      await githubTokenStorage.set(token);
      setSavedToken(token);
      setMessage({ text: 'Token saved successfully', type: 'success' });

      // Clear the input after successful save
      setToken('');
    } catch (error) {
      console.error('Error saving token:', error);
      setMessage({ text: 'Failed to save token', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearToken = async () => {
    try {
      setIsSaving(true);
      await githubTokenStorage.clear();
      setSavedToken('');
      setMessage({ text: 'Token cleared successfully', type: 'success' });
    } catch (error) {
      console.error('Error clearing token:', error);
      setMessage({ text: 'Failed to clear token', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded p-4 w-full mt-4">
      <h3 className="text-lg font-bold mb-3">GitHub Token Settings</h3>
      <div className="mb-4">
        <p className="text-sm mb-2">
          {savedToken
            ? 'GitHub token is set. You can update or clear it below.'
            : 'Set your GitHub Personal Access Token to improve API rate limits and access private repositories.'}
        </p>

        {savedToken && (
          <div className="flex items-center mb-3">
            <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded flex-grow mr-2 font-mono">
              {showToken ? savedToken : '•'.repeat(Math.min(savedToken.length, 24))}
            </div>
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-xs bg-gray-200 hover:bg-gray-300 p-1 rounded">
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
        )}

        <div className="flex">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter GitHub PAT..."
            className="flex-grow p-2 border rounded-l text-sm"
          />
          <button
            onClick={handleSaveToken}
            disabled={isSaving || !token}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-r text-sm disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {savedToken && (
          <button
            onClick={handleClearToken}
            disabled={isSaving}
            className="text-xs text-red-500 hover:text-red-600 mt-2">
            Clear token
          </button>
        )}

        {message.text && (
          <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

// Component for file checklist items
interface FileChecklistProps {
  file: PRData['files'][0];
  onCommentChange: (filename: string, comments: string) => void;
  onChecklistChange: (filename: string, checklistItems: Record<string, boolean>) => void;
}

const FileChecklist = ({ file, onCommentChange, onChecklistChange }: FileChecklistProps) => {
  const [comment, setComment] = useState(file.comments || '');
  // State to track checklist items - Initialize from saved data if available
  const [checklistItems, setChecklistItems] = useState(
    file.checklistItems || {
      formatting: false,
      docs: false,
      tests: false,
      performance: false,
    },
  );
  // Override to force expanded state (when user clicks to manually open/close)
  const [expandOverride, setExpandOverride] = useState<boolean | null>(null);
  // Track if all items were just checked to trigger auto-collapse
  const [allItemsJustChecked, setAllItemsJustChecked] = useState(false);

  // Calculate review status directly from checklist items
  const getReviewStatus = (): 'approved' | 'needs-work' | 'not-reviewed' => {
    const allChecked = Object.values(checklistItems).every(item => item === true);
    const anyChecked = Object.values(checklistItems).some(item => item === true);

    if (allChecked) {
      return 'approved';
    } else if (anyChecked) {
      return 'needs-work';
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

    const allChecked = Object.values(checklistItems).every(item => item === true);

    // If all checks complete, collapse it
    if (allChecked && allItemsJustChecked) {
      return false;
    }

    // Not reviewed items should be expanded by default
    if (getReviewStatus() === 'not-reviewed') {
      return true;
    }

    // In progress items should be expanded
    if (getReviewStatus() === 'needs-work') {
      return true;
    }

    return false; // Approved items default to collapsed
  };

  // Computed expanded state
  const expanded = getCalculatedExpandedState();

  // Update review status whenever checklist items change
  useEffect(() => {
    // Update the checklistItems in the parent component
    console.log(`Updating checklist for file: ${file.filename}`, checklistItems);
    onChecklistChange(file.filename, checklistItems);

    // Check if all items just became checked
    const allChecked = Object.values(checklistItems).every(item => item === true);
    if (allChecked && !allItemsJustChecked) {
      setAllItemsJustChecked(true);
      // Reset the override when items are all checked
      setExpandOverride(null);
    } else if (!allChecked) {
      setAllItemsJustChecked(false);
    }
  }, [checklistItems, file.filename, onChecklistChange, allItemsJustChecked]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    onCommentChange(file.filename, e.target.value);
  };

  const handleChecklistChange = (item: keyof typeof checklistItems) => {
    console.log(`Changing checklist item '${item}' for file: ${file.filename}`);
    const newChecklistItems = {
      ...checklistItems,
      [item]: !checklistItems[item],
    };

    // 変更を即座に適用
    setChecklistItems(newChecklistItems);

    // useEffectを待たずに親コンポーネントに即座に通知
    // これにより、最初のアイテムもすぐに保存される
    onChecklistChange(file.filename, newChecklistItems);
  };

  // Toggle expanded state manually
  const toggleExpanded = () => {
    // タブを閉じる操作の場合
    if (expanded) {
      // すべてのチェックボックスをオンにする
      const allCheckedItems = {
        formatting: true,
        docs: true,
        tests: true,
        performance: true,
      };

      // チェックボックスをすべてONに変更
      setChecklistItems(allCheckedItems);

      // 親コンポーネントに変更を通知
      onChecklistChange(file.filename, allCheckedItems);

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
      case 'needs-work':
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
      <div
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50"
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}>
        <div className="flex items-center">
          <span
            className={`inline-block w-5 text-center mr-2 ${
              file.status === 'added'
                ? 'text-green-500'
                : file.status === 'removed'
                  ? 'text-red-500'
                  : 'text-yellow-500'
            }`}>
            {file.status === 'added' ? 'A' : file.status === 'removed' ? 'D' : 'M'}
          </span>
          <span className="font-medium truncate">{file.filename}</span>
        </div>
        <div className="flex items-center">
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
      </div>

      {expanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">Review Checklist</h4>
              <div className="text-xs text-gray-500 mb-2">
                <p>Complete all checklist items to mark this file as approved</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${file.filename}-formatting`}
                    className="rounded"
                    checked={checklistItems.formatting}
                    onChange={() => handleChecklistChange('formatting')}
                  />
                  <label htmlFor={`${file.filename}-formatting`} className="text-sm">
                    Code follows formatting standards
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${file.filename}-docs`}
                    className="rounded"
                    checked={checklistItems.docs}
                    onChange={() => handleChecklistChange('docs')}
                  />
                  <label htmlFor={`${file.filename}-docs`} className="text-sm">
                    Documentation is updated
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${file.filename}-tests`}
                    className="rounded"
                    checked={checklistItems.tests}
                    onChange={() => handleChecklistChange('tests')}
                  />
                  <label htmlFor={`${file.filename}-tests`} className="text-sm">
                    Tests are included/updated
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${file.filename}-performance`}
                    className="rounded"
                    checked={checklistItems.performance}
                    onChange={() => handleChecklistChange('performance')}
                  />
                  <label htmlFor={`${file.filename}-performance`} className="text-sm">
                    Performance considerations addressed
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Review Comments</h4>
              <textarea
                value={comment}
                onChange={handleCommentChange}
                placeholder="Add review comments here..."
                className="w-full p-2 text-sm border rounded h-20 bg-white"
              />
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

  // Render appropriate view based on URL
  return (
    <div>
      {isGitHubPRPage(currentPage?.url || '') ? <GitHubPRView url={currentPage.url} /> : <DefaultView />}

      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
          title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
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

            <GitHubTokenSettings />
          </div>
        </div>
      )}
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
