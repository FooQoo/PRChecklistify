import type { PRData, PRAnalysisResult, PRIdentifier } from '../types';
import { fetchPRData, prDataStorage } from '../services/prDataService';
import { extractPRInfoFromKey } from '@src/utils/prUtils';

// 現在のページURLからPRIdentifierを作成する関数
const createPRIdentifierFromCurrentPage = async (prKey: string): Promise<PRIdentifier | null> => {
  const basicInfo = extractPRInfoFromKey(prKey);
  if (!basicInfo) return null;

  try {
    // Chrome extension APIを使って現在のアクティブタブのURLを取得
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].url) {
      const url = tabs[0].url;
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      return {
        ...basicInfo,
        domain,
      };
    }
  } catch (error) {
    console.warn('Failed to get current tab URL:', error);
  }

  // フォールバック: github.comをデフォルトとして使用
  return {
    ...basicInfo,
    domain: 'github.com',
  };
};

export const loadPRDataFromAnySource = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setAnalysisResult: (result: PRAnalysisResult | undefined) => void,
  setError: (err: string | null) => void,
) => {
  const identifier = await createPRIdentifierFromCurrentPage(prKey);
  if (!identifier) {
    return;
  }
  try {
    const savedData = await prDataStorage.getFromStorage(prKey);
    if (savedData) {
      setPRData(savedData.data);
      if (savedData.analysisResult) {
        setAnalysisResult(savedData.analysisResult);
      } else {
        setAnalysisResult(undefined);
      }
    } else {
      const newData = await fetchPRData(identifier);
      if (newData) {
        setPRData(newData);
        await prDataStorage.savePRDataToStorage(prKey, newData);
        setAnalysisResult(undefined);
      } else {
        setError('Failed to load PR data');
      }
    }
  } catch {
    setError('An error occurred while loading PR data');
  }
};

export const fetchAndSetPRData = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setError: (err: string | null) => void,
  setIsLoading: (b: boolean) => void,
) => {
  const identifier = await createPRIdentifierFromCurrentPage(prKey);
  if (!identifier) return;
  setIsLoading(true);
  setError(null);
  try {
    const newData = await fetchPRData(identifier);
    if (newData) {
      setPRData(newData);
      await prDataStorage.savePRDataToStorage(prKey, newData);
    } else {
      setError('Failed to refresh PR data');
    }
  } catch {
    setError('An error occurred while refreshing PR data');
  } finally {
    setIsLoading(false);
  }
};
