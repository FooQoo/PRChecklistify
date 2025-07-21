import type { PRData, PRAnalysisResult, PRIdentifier } from '@src/types';
import { prDataService, prDataStorageService } from '@src/di';
import { extractPRInfoFromKey } from '@src/utils/prUtils';
import type { ErrorKeyType } from '@src/hooks/usePRData';
import { GitHubError } from '@src/errors/GitHubError';
import { createInitialPRAnalysisResult, updatePRAnalysisResultWithNewFiles } from '@src/utils/prAnalysisResultUtils';

export const loadPRDataFromAnySource = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setAnalysisResult: (result: PRAnalysisResult | null) => void,
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
    const savedData = await prDataStorageService.getFromStorage(prKey);
    if (savedData) {
      setPRData(savedData.data);
      if (savedData.analysisResult) {
        setAnalysisResult(savedData.analysisResult);
      } else {
        // 保存されたデータにanalysisResultがない場合は初期化
        setAnalysisResult(createInitialPRAnalysisResult(savedData.data));
      }
    } else {
      const newData = await prDataService.fetchPRData(identifier);
      if (newData) {
        setPRData(newData);
        await prDataStorageService.savePRDataToStorage(prKey, newData);
        // 新しいデータの場合は初期化したanalysisResultを設定
        setAnalysisResult(createInitialPRAnalysisResult(newData));
      } else {
        setError('failedToLoadPrData');
      }
    }
  } catch (error) {
    if (GitHubError.isGitHubError(error)) {
      setError(error.i18nKey as ErrorKeyType);
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
    const newData = await prDataService.fetchPRData(identifier);
    if (newData) {
      setPRData(newData);
      await prDataStorageService.savePRDataToStorage(prKey, newData);
    } else {
      setError('failedToLoadPrData');
    }
  } catch (error) {
    if (GitHubError.isGitHubError(error)) {
      setError(error.i18nKey as ErrorKeyType);
    }
  } finally {
    setIsLoading(false);
  }
};
