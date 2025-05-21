import { useState, useEffect } from 'react';
import { useAtom, atom } from 'jotai';
import type { PRData, PRAnalysisResult } from '../types';
import { fetchPRData, prDataStorage } from '../services/prDataService';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { extractPRInfoFromKey } from '@src/utils/prUtils';

const currentPrDataAtom = atom<PRData | null>(null);

// PRデータを管理するためのカスタムフック
export function usePRData(prKey: string) {
  const [prData, setPRData] = useAtom(currentPrDataAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
  const saveAnalysisResult = async (result: PRAnalysisResult | undefined) => {
    if (!prData || !prKey) return;

    setAnalysisResult(result);

    try {
      await prDataStorage.saveToStorage(prKey, prData, result);
    } catch (err) {
      console.error('Error saving analysis result:', err);
    }
  };

  // データを強制的に再読み込みする関数
  const refreshData = async () => {
    if (!prKey) return;

    await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading, analysisResult);
  };

  // PRデータをストレージ優先で取得し、なければAPIから取得
  const loadPRDataFromAnySource = async (
    prKey: string,
    setPRData: (data: PRData | null) => void,
    setAnalysisResult: (result: PRAnalysisResult | undefined) => void,
    setError: (err: string | null) => void,
  ) => {
    const identifier = extractPRInfoFromKey(prKey);
    if (!identifier) {
      console.log('Not a PR URL, skipping data loading:', prKey);
      return;
    }
    try {
      // まずストレージからデータを取得してみる
      const savedData = await prDataStorage.getFromStorage(prKey);
      if (savedData) {
        setPRData(savedData.data);
        if (savedData.analysisResult) {
          setAnalysisResult(savedData.analysisResult);
        } else {
          setAnalysisResult(undefined);
        }
        console.log('Loaded PR data from storage:', prKey);
      } else {
        // なければAPIから取得
        console.log('Fetching PR data from API:', prKey);
        const newData = await fetchPRData(identifier);
        if (newData) {
          setPRData(newData);
          await prDataStorage.saveToStorage(prKey, newData);
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

  // PRデータをAPIから強制取得し、状態を更新
  const fetchAndSetPRData = async (
    prKey: string,
    setPRData: (data: PRData | null) => void,
    setError: (err: string | null) => void,
    setIsLoading: (b: boolean) => void,
    analysisResult: PRAnalysisResult | undefined,
  ) => {
    const identifier = extractPRInfoFromKey(prKey);
    if (!identifier) return;
    setIsLoading(true);
    setError(null);
    try {
      const newData = await fetchPRData(identifier);
      if (newData) {
        setPRData(newData);
        await prDataStorage.saveToStorage(prKey, newData, analysisResult || undefined);
      } else {
        setError('Failed to refresh PR data');
      }
    } catch {
      setError('An error occurred while refreshing PR data');
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
    saveAnalysisResult,
    refreshData,
    approvedFilesCount,
    currentApprovalPercentage,
    isJustCompleted,
  };
}

// ファイルごとの承認状況と承認率を計算するユーティリティ関数群
const getApprovedFiles = (prData: PRData | null, analysisResult: PRAnalysisResult | undefined): number => {
  if (!prData || !analysisResult) return 0;

  return prData.files.filter(file => {
    const fileChecklist = analysisResult.fileAnalysis.find(checklist => checklist.filename === file.filename);

    if (!fileChecklist) return false;

    // すべてのチェックリストアイテムが'OK'になっているか確認
    return fileChecklist.checklistItems.every(item => item.status === 'OK');
  }).length;
};

// 承認率を計算するユーティリティ関数 (0-100%)
const getApprovalPercentage = (prData: PRData | null, analysisResult: PRAnalysisResult | undefined): number | null => {
  if (!prData || prData.files.length === 0) return null;
  return (getApprovedFiles(prData, analysisResult) / prData.files.length) * 100;
};

// レビュー時間を計算するユーティリティ関数
export const calculateReviewTime = (prData: PRData): { minutes: number } => {
  // ファイル数と変更行数から推定時間を計算
  const totalFiles = prData.files.length;
  const totalChanges = prData.files.reduce((sum, file) => sum + file.additions + file.deletions, 0);

  let minutes = 0;

  // 基本的な計算ロジック（例）
  if (totalChanges < 100 && totalFiles < 5) {
    minutes = Math.max(5, Math.ceil(totalChanges / 10));
  } else if (totalChanges < 500 && totalFiles < 20) {
    minutes = Math.max(10, Math.ceil(totalChanges / 8));
  } else {
    minutes = Math.max(30, Math.ceil(totalChanges / 5));
  }

  return { minutes };
};
