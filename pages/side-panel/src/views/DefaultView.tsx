import { useState, useEffect } from 'react';
import { useI18n } from '@extension/i18n';
import { useNavigation } from '../context/NavigationContext';
import { isGitHubPRPage, extractPRInfoFromKey } from '../utils/prUtils';

const DefaultView: React.FC = () => {
  const { t } = useI18n();
  const { navigateToPr, navigateToPrFromHistory } = useNavigation();
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [recentPRs, setRecentPRs] = useState<{ url: string; title: string; timestamp: number; key: string }[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);

  // 最近表示したPRの履歴を読み込む
  useEffect(() => {
    const loadRecentPRs = async () => {
      try {
        const result = await chrome.storage.local.get('recentPRs');
        if (result.recentPRs && Array.isArray(result.recentPRs)) {
          // タイムスタンプで並べ替え（最新順）
          const sortedPRs = [...result.recentPRs].sort((a, b) => b.timestamp - a.timestamp);
          setRecentPRs(sortedPRs);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* empty */
      }
    };

    loadRecentPRs();
  }, []);

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
  };

  // PRナビゲーションハンドラー
  const handleGoToPR = () => {
    if (!isValid) return;
    navigateToPr(prUrl);
  };

  // 履歴からのPRナビゲーションハンドラー
  const handleRecentPRClick = (prKey: string) => {
    const prInfo = extractPRInfoFromKey(prKey);
    if (!prInfo) return;
    // PR情報を抽出してナビゲーション
    navigateToPrFromHistory(prInfo.domain, prInfo.owner, prInfo.repo, prInfo.prNumber);
  };

  // 表示する最近のPR数を制御
  const displayedPRs = showAllRecent ? recentPRs : recentPRs.slice(0, 5);
  const hasMorePRs = recentPRs.length > 5;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">PR Checklistify</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">{t('enterPrUrlPrompt')}</p>

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
              placeholder="https://example.com/owner/repo/pull/123"
              className={`flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:z-10 ${
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

        {recentPRs.length > 0 && (
          <div className="recent-prs mb-6">
            <h2 className="text-lg font-semibold mb-2">Recent Pull Requests</h2>
            <ul className="divide-y divide-gray-200">
              {displayedPRs.map((pr, index) => {
                const prInfo = extractPRInfoFromKey(pr.key);
                const prIdentifier = prInfo
                  ? `${prInfo.domain}/${prInfo.owner}/${prInfo.repo}#${prInfo.prNumber}`
                  : pr.key;

                return (
                  <li key={index} className="py-2">
                    <button
                      onClick={() => handleRecentPRClick(pr.key)}
                      className="w-full text-left hover:bg-gray-50 p-2 rounded">
                      <div className="text-sm font-medium text-blue-600 truncate">{pr.title}</div>
                      <div className="text-xs text-gray-500 truncate">{prIdentifier}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(pr.timestamp).toLocaleString()}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {hasMorePRs && !showAllRecent && (
              <button
                onClick={() => setShowAllRecent(true)}
                className="group mt-2 text-sm text-blue-500 hover:text-blue-700 w-full text-center hover:scale-100 hover:shadow-none">
                <span className="inline-block transition-transform group-hover:-translate-y-0.5">
                  Show All ({recentPRs.length})
                </span>
              </button>
            )}
            {showAllRecent && recentPRs.length > 5 && (
              <button
                onClick={() => setShowAllRecent(false)}
                className="group mt-2 text-sm text-blue-500 hover:text-blue-700 w-full text-center hover:scale-100 hover:shadow-none">
                <span className="inline-block transition-transform group-hover:-translate-y-0.5">Show Less</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefaultView;
