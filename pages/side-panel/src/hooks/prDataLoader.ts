import type { PRData, PRAnalysisResult, PRIdentifier } from '../types';
import { fetchPRData, prDataStorage } from '../services/prDataService';
import { extractPRInfoFromKey } from '@src/utils/prUtils';

// 現在のページURLからPRIdentifierを作成する関数
const createPRIdentifierFromCurrentPage = async (prKey: string): Promise<PRIdentifier | null> => {
  const basicInfo = extractPRInfoFromKey(prKey);
  if (!basicInfo) return null;

  // prKey now includes domain information, so we can use it directly
  return {
    owner: basicInfo.owner,
    repo: basicInfo.repo,
    prNumber: basicInfo.prNumber,
    domain: basicInfo.domain,
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
