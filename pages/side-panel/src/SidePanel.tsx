import { useEffect, useState } from 'react';
import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, githubTokenStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">GitHub Token Required</h2>

        <p className="text-sm mb-4">
          A GitHub Personal Access Token (PAT) is required to access PR data. This helps with API rate limits and allows
          access to private repositories.
        </p>

        <div className="mb-4 border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 text-xs">
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
const GitHubPRView = ({ url, theme }: { url: string; theme: string }) => {
  const isLight = theme === 'light';
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';
  const [prData, setPRData] = useState<PRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

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
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        <h2>GitHub PR Checklist</h2>

        {prData ? (
          <div className="w-full max-w-md">
            <div className="pr-header mb-4">
              <h3 className="text-xl font-bold mb-2">{prData.title}</h3>
              <div className="flex items-center text-sm mb-2">
                <img src={prData.user.avatar_url} alt="User Avatar" className="w-6 h-6 rounded-full mr-2" />
                <span>{prData.user.login}</span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                <div>Created: {formatDate(prData.created_at)}</div>
                <div>Updated: {formatDate(prData.updated_at)}</div>
                <div className="mt-1">
                  {prData.head.ref} → {prData.base.ref}
                </div>
              </div>
            </div>

            <div className="stats flex justify-between mb-4 text-sm p-2 rounded bg-gray-100 dark:bg-gray-700">
              <span className="text-green-600">+{prData.diffStats.additions}</span>
              <span className="text-red-600">-{prData.diffStats.deletions}</span>
              <span>{prData.diffStats.changedFiles} files</span>
            </div>

            <div className="description border border-gray-300 rounded p-4 mb-4 w-full text-left text-sm">
              <h4 className="font-bold mb-2">Description:</h4>
              <div className="markdown-content overflow-auto max-h-60">
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose dark:prose-invert prose-sm max-w-none">
                  {prData.description}
                </ReactMarkdown>
              </div>
            </div>

            <div className="files border border-gray-300 rounded p-4 w-full text-left">
              <h4 className="font-bold mb-2">Changed Files:</h4>
              <ul className="max-h-60 overflow-y-auto">
                {prData.files.map((file, index) => (
                  <li key={index} className="mb-2 text-sm">
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
                    </div>
                    {file.patch && file.patch.length < 200 && (
                      <pre className="text-xs mt-1 ml-6 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                        {file.patch}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-gray-300 rounded p-4 w-full max-w-md mt-4">
              <h3 className="text-lg font-bold mb-3">PR Checklist</h3>
              <ul className="text-left">
                <li className="mb-2">✅ Code formatting is consistent</li>
                <li className="mb-2">✅ Tests have been added</li>
                <li className="mb-2">❌ Documentation is updated</li>
                <li className="mb-2">⏳ Performance considerations addressed</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-red-500">Failed to load PR data. Please check your connection or PR URL.</p>
        )}

        <ToggleButton onClick={exampleThemeStorage.toggle} className="mt-6">
          {t('toggleTheme')}
        </ToggleButton>
      </header>
    </div>
  );
};

// Component for non-GitHub PR pages
const DefaultView = ({ theme }: { theme: string }) => {
  const isLight = theme === 'light';
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <h2>PR Checklistify</h2>
        <p className="mb-4">Navigate to a GitHub PR to see the checklist.</p>
        <p className="text-sm mb-3">
          Edit <code>pages/side-panel/src/SidePanel.tsx</code> to customize.
        </p>
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
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
            <div className="text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 p-2 rounded flex-grow mr-2 font-mono">
              {showToken ? savedToken : '•'.repeat(Math.min(savedToken.length, 24))}
            </div>
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-1 rounded">
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

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
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
      {isGitHubPRPage(currentPage?.url || '') ? (
        <GitHubPRView url={currentPage.url} theme={theme} />
      ) : (
        <DefaultView theme={theme} />
      )}

      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-full"
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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

            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-3">Theme</h3>
              <ToggleButton onClick={exampleThemeStorage.toggle}>
                {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              </ToggleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
