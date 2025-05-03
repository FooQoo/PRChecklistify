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
    reviewStatus?: 'approved' | 'needs-work' | 'not-reviewed'; // Status of review for this file
    comments?: string; // Any review comments for this file
  }[];
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
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
        reviewStatus: 'not-reviewed', // Initialize all files as not reviewed
        comments: '',
      })),
      user: {
        login: prData.user.login,
        avatar_url: prData.user.avatar_url,
      },
      created_at: prData.created_at,
      updated_at: prData.updated_at,
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

// Format date to a more readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
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
  const [showDetailedChecklists, setShowDetailedChecklists] = useState(false);

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
          const data = await fetchPRData(url);
          if (data) {
            setPRData(data);
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

  const handleFileStatusChange = (filename: string, status: 'approved' | 'needs-work' | 'not-reviewed') => {
    if (!prData) return;

    const updatedFiles = prData.files.map(file => {
      if (file.filename === filename) {
        return { ...file, reviewStatus: status };
      }
      return file;
    });

    setPRData({ ...prData, files: updatedFiles });
  };

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

  const getOverallReviewProgress = () => {
    if (!prData) return { total: 0, reviewed: 0, approved: 0, needsWork: 0 };

    const total = prData.files.length;
    const reviewed = prData.files.filter(f => f.reviewStatus !== 'not-reviewed').length;
    const approved = prData.files.filter(f => f.reviewStatus === 'approved').length;
    const needsWork = prData.files.filter(f => f.reviewStatus === 'needs-work').length;

    return { total, reviewed, approved, needsWork };
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

  const progress = getOverallReviewProgress();

  return (
    <div className="App bg-slate-50">
      <header className="App-header text-gray-900">
        {prData ? (
          <div className="w-full max-w-3xl px-4">
            <div className="pr-header mb-2">
              <h3 className="text-xl font-bold mb-1">{prData.title}</h3>
              <div className="flex items-center text-sm mb-1">
                <img src={prData.user.avatar_url} alt="User Avatar" className="w-6 h-6 rounded-full mr-2" />
                <span>{prData.user.login}</span>
              </div>
              <div className="text-xs text-gray-500 mb-1">
                <div>Created: {formatDate(prData.created_at)}</div>
                <div>Updated: {formatDate(prData.updated_at)}</div>
                <div className="mt-1">
                  {prData.head.ref} → {prData.base.ref}
                </div>
              </div>
            </div>

            <div className="stats flex justify-between mb-2 text-sm p-2 rounded bg-gray-100">
              <span className="text-green-600">+{prData.diffStats.additions}</span>
              <span className="text-red-600">-{prData.diffStats.deletions}</span>
              <span>{prData.diffStats.changedFiles} files</span>
            </div>

            <div className="review-progress border border-gray-300 rounded p-2 mb-2 w-full">
              <h4 className="font-bold mb-1">Review Progress:</h4>
              <div className="flex justify-between mb-1 text-sm">
                <span>
                  Reviewed: {progress.reviewed}/{progress.total} files
                </span>
                <span>Approved: {progress.approved}</span>
                <span>Needs Work: {progress.needsWork}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${(progress.reviewed / progress.total) * 100}%` }}></div>
              </div>
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
                  <button
                    onClick={() => setShowDetailedChecklists(!showDetailedChecklists)}
                    className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200">
                    {showDetailedChecklists ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {showDetailedChecklists ? (
                  <div className="detailed-checklists">
                    {prData.files.map((file, index) => (
                      <FileChecklist
                        key={index}
                        file={file}
                        onStatusChange={handleFileStatusChange}
                        onCommentChange={handleFileCommentChange}
                      />
                    ))}
                  </div>
                ) : (
                  <ul>
                    {prData.files.map((file, index) => (
                      <li key={index} className="mb-1 text-sm">
                        <div className="flex items-center">
                          <span
                            className={`inline-block w-5 text-center mr-1 ${
                              file.status === 'added'
                                ? 'text-green-500'
                                : file.status === 'removed'
                                  ? 'text-red-500'
                                  : 'text-yellow-500'
                            }`}>
                            {file.status === 'added' ? 'A' : file.status === 'removed' ? 'D' : 'M'}
                          </span>
                          <span className="text-xs mr-2">
                            (+<span className="text-green-600">{file.additions}</span>/ -
                            <span className="text-red-600">{file.deletions}</span>)
                          </span>
                          <span className="truncate">{file.filename}</span>

                          {file.reviewStatus && (
                            <span
                              className={`ml-2 inline-block px-2 py-0.5 text-xs rounded-full text-white ${
                                file.reviewStatus === 'approved'
                                  ? 'bg-green-500'
                                  : file.reviewStatus === 'needs-work'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-400'
                              }`}>
                              {file.reviewStatus === 'approved' ? '✓' : file.reviewStatus === 'needs-work' ? '⚠' : '⊘'}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border border-gray-300 rounded p-2 w-full max-w-3xl mt-2">
              <h3 className="text-md font-bold mb-1">PR Summary Checklist</h3>
              <div className="grid grid-cols-2 gap-1 text-left">
                <div className="flex items-start">
                  <input type="checkbox" id="code-formatting" className="mt-1 mr-1 rounded" />
                  <label htmlFor="code-formatting" className="text-sm">
                    Code formatting
                  </label>
                </div>
                <div className="flex items-start">
                  <input type="checkbox" id="tests-added" className="mt-1 mr-1 rounded" />
                  <label htmlFor="tests-added" className="text-sm">
                    Tests updated
                  </label>
                </div>
                <div className="flex items-start">
                  <input type="checkbox" id="docs-updated" className="mt-1 mr-1 rounded" />
                  <label htmlFor="docs-updated" className="text-sm">
                    Documentation
                  </label>
                </div>
                <div className="flex items-start">
                  <input type="checkbox" id="performance" className="mt-1 mr-1 rounded" />
                  <label htmlFor="performance" className="text-sm">
                    Performance
                  </label>
                </div>
                <div className="flex items-start">
                  <input type="checkbox" id="security" className="mt-1 mr-1 rounded" />
                  <label htmlFor="security" className="text-sm">
                    Security
                  </label>
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
  onStatusChange: (filename: string, status: 'approved' | 'needs-work' | 'not-reviewed') => void;
  onCommentChange: (filename: string, comments: string) => void;
}

const FileChecklist = ({ file, onStatusChange, onCommentChange }: FileChecklistProps) => {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState(file.comments || '');

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    onCommentChange(file.filename, e.target.value);
  };

  return (
    <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
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

      {expanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">Review Status</h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onStatusChange(file.filename, 'approved')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    file.reviewStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-green-100'
                  }`}>
                  ✓ Approved
                </button>
                <button
                  onClick={() => onStatusChange(file.filename, 'needs-work')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    file.reviewStatus === 'needs-work' ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-yellow-100'
                  }`}>
                  ⚠ Needs Work
                </button>
                <button
                  onClick={() => onStatusChange(file.filename, 'not-reviewed')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    file.reviewStatus === 'not-reviewed' || !file.reviewStatus
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                  ⊘ Not Reviewed
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Review Checklist</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`${file.filename}-formatting`} className="rounded" />
                  <label htmlFor={`${file.filename}-formatting`} className="text-sm">
                    Code follows formatting standards
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`${file.filename}-docs`} className="rounded" />
                  <label htmlFor={`${file.filename}-docs`} className="text-sm">
                    Documentation is updated
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`${file.filename}-tests`} className="rounded" />
                  <label htmlFor={`${file.filename}-tests`} className="text-sm">
                    Tests are included/updated
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`${file.filename}-performance`} className="rounded" />
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
                <h4 className="text-sm font-semibold mb-2">Diff</h4>
                <pre className="text-xs p-2 bg-gray-100 rounded overflow-x-auto max-h-96">{file.patch}</pre>
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
