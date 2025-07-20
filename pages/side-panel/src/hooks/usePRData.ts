import { useState, useEffect } from 'react';
import { useAtom, atom } from 'jotai';
import type { PRData, PRAnalysisResult, Checklist } from '@src/types';
import { prDataStorage } from '@src/services/prDataService';
import { GitHubError } from '@src/errors/GitHubError';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { loadPRDataFromAnySource, fetchAndSetPRData } from './prDataLoader';
import { getApprovedFiles, getApprovalPercentage } from '@src/utils/prApprovalUtils';

const currentPrDataAtom = atom<PRData | null>(null);

export type ErrorKeyType =
  | 'githubTokenNotFound'
  | 'githubAuthenticationError'
  | 'failedToLoadPrData'
  | 'errorOccurredWhileLoadingPrData'
  | 'failedToRefreshPrData'
  | 'error'
  | null;

// PRデータを管理するためのカスタムフック
export function usePRData(prKey: string) {
  const [prData, setPRData] = useAtom(currentPrDataAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorKeyType>(null);
  const [analysisResult, setAnalysisResult] = useState<PRAnalysisResult | undefined>(undefined);
  const [previousApprovalPercentage, setPreviousApprovalPercentage] = useState<number | null>(null);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [isGenerating] = useAtom(generatingAtom);

  // PR情報を取得する関数
  useEffect(() => {
    if (isGenerating) return;
    setPreviousApprovalPercentage(null);
    setIsJustCompleted(false);
    setIsLoading(true);
    setError(null);
    loadPRDataFromAnySource(prKey, setPRData, setAnalysisResult, setError).finally(() => setIsLoading(false));
  }, [prKey, isGenerating, setPRData]);

  // 分析結果を保存する関数
  const saveAnalysisResultSummary = async (summary: string) => {
    if (!prData || !prKey) return;

    setAnalysisResult(prev => {
      const newResult = {
        ...prev,
        summary,
      } as PRAnalysisResult;
      // ストレージ保存もこの中で
      prDataStorage.saveAnalysisResultToStorage(prKey, newResult);
      return newResult;
    });
  };

  const saveAnalysisResultChecklist = async (fileChecklist: Checklist) => {
    if (!prData || !prKey) return;

    setAnalysisResult(prev => {
      let newFileAnalysis: Checklist[];
      if (prev?.fileAnalysis?.some(item => item.filename === fileChecklist.filename)) {
        newFileAnalysis = prev.fileAnalysis.map(item =>
          item.filename === fileChecklist.filename ? fileChecklist : item,
        );
      } else {
        newFileAnalysis = (prev?.fileAnalysis || []).concat(fileChecklist);
      }
      const newResult = {
        ...prev,
        fileAnalysis: newFileAnalysis,
      } as PRAnalysisResult;
      prDataStorage.saveAnalysisResultToStorage(prKey, newResult);
      return newResult;
    });
  };

  // データを強制的に再読み込みする関数
  const refreshData = async () => {
    if (!prKey) return;

    await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading);
  };

  // PRデータをAPIから再取得して状態を更新する関数
  const reloadPRData = async () => {
    if (!prKey) return null;
    setIsLoading(true);
    setError(null);
    try {
      await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading);
      return prData;
    } catch (error) {
      if (GitHubError.isGitHubError(error)) {
        setError(error.i18nKey as ErrorKeyType);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 現在の承認状態を計算
  const approvedFilesCount = prData && analysisResult ? getApprovedFiles(prData, analysisResult) : 0;

  const currentApprovalPercentage = prData && analysisResult ? getApprovalPercentage(prData, analysisResult) : null;

  // 承認率の変化を監視し、完了状態を検出する
  useEffect(() => {
    if (currentApprovalPercentage === 100 && previousApprovalPercentage !== null && previousApprovalPercentage < 100) {
      setIsJustCompleted(true);
    } else if (currentApprovalPercentage !== previousApprovalPercentage) {
      setIsJustCompleted(false);
      setPreviousApprovalPercentage(currentApprovalPercentage);
    }
  }, [currentApprovalPercentage, previousApprovalPercentage]);

  // isJustCompletedがtrueになったら5秒後にfalseに戻す
  useEffect(() => {
    if (isJustCompleted) {
      const timer = setTimeout(() => {
        setIsJustCompleted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isJustCompleted]);

  return {
    prData,
    isLoading,
    error,
    analysisResult,
    saveAnalysisResultSummary,
    saveAnalysisResultChecklist,
    refreshData,
    reloadPRData,
    approvedFilesCount,
    currentApprovalPercentage,
    isJustCompleted,
  };
}
