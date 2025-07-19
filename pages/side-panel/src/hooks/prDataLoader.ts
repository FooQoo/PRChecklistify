import type { PRData, PRAnalysisResult, PRIdentifier } from '../types';
import { fetchPRData, GitHubAuthenticationError, prDataStorage } from '../services/prDataService';
import { extractPRInfoFromKey } from '@src/utils/prUtils';
import type { ErrorKeyType } from './usePRData';

export const loadPRDataFromAnySource = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setAnalysisResult: (result: PRAnalysisResult | undefined) => void,
  setError: (err: ErrorKeyType) => void,
) => {
  const basicInfo = extractPRInfoFromKey(prKey);
  if (!basicInfo) {
    return;
  }
  const identifier: PRIdentifier = {
    owner: basicInfo.owner,
    repo: basicInfo.repo,
    prNumber: basicInfo.prNumber,
    domain: basicInfo.domain,
  };
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
        setError('failedToLoadPrData');
      }
    }
  } catch (error) {
    if (error instanceof GitHubAuthenticationError) {
      setError('githubAuthenticationError');
    } else {
      setError('errorOccurredWhileLoadingPrData');
    }
  }
};

export const fetchAndSetPRData = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setError: (err: ErrorKeyType) => void,
  setIsLoading: (b: boolean) => void,
) => {
  const basicInfo = extractPRInfoFromKey(prKey);
  if (!basicInfo) return;
  const identifier: PRIdentifier = {
    owner: basicInfo.owner,
    repo: basicInfo.repo,
    prNumber: basicInfo.prNumber,
    domain: basicInfo.domain,
  };
  setIsLoading(true);
  setError(null);
  try {
    const newData = await fetchPRData(identifier);
    if (newData) {
      setPRData(newData);
      await prDataStorage.savePRDataToStorage(prKey, newData);
    } else {
      setError('failedToRefreshPrData');
    }
  } catch (error) {
    if (error instanceof GitHubAuthenticationError) {
      setError('githubAuthenticationError');
    } else {
      setError('errorOccurredWhileRefreshingPrData');
    }
  } finally {
    setIsLoading(false);
  }
};
