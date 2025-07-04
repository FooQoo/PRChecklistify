import type { PRData, PRAnalysisResult } from '../types';
import { fetchPRData, prDataStorage } from '../services/prDataService';
import { extractPRInfoFromKey } from '@src/utils/prUtils';

export const loadPRDataFromAnySource = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setAnalysisResult: (result: PRAnalysisResult | undefined) => void,
  setError: (err: string | null) => void,
) => {
  const identifier = extractPRInfoFromKey(prKey);
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
    console.error('Error in loadPRData');
    setError('An error occurred while loading PR data');
  }
};

export const fetchAndSetPRData = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setError: (err: string | null) => void,
  setIsLoading: (b: boolean) => void,
) => {
  const identifier = extractPRInfoFromKey(prKey);
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
