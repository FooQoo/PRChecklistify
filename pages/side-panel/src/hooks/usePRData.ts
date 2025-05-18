import { useState, useEffect } from 'react';
import { useAtom, atom } from 'jotai';
import type { PRData, PRAnalysisResult, PRIdentifier } from '../types';
import { fetchPRData, prDataStorage, generatePRKey } from '../services/prDataService';

export const currentPageAtom = atom<{ url: string | null; key?: string | null }>({ url: null });

// GitHub URLからPRの識別子（owner, repo, PR番号）を抽出する関数
export const extractPRIdentifier = (url: string): PRIdentifier | null => {
  const match = url.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;

  const [, owner, repo, prNumber] = match;
  return { owner, repo, prNumber };
};

// PRデータを取得するための関数
// const fetchPRData = async (identifier: PRIdentifier): Promise<PRData | null> => {
//   const { owner, repo, prNumber } = identifier;

//   try {
//     // GitHub APIトークンを取得
//     const token = await githubTokenStorage.get();
//     const headers: HeadersInit = {
//       Accept: 'application/vnd.github.v3+json',
//     };

//     if (token) {
//       headers['Authorization'] = `token ${token}`;
//     }

//     // PRの基本情報を取得
//     const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
//       headers,
//     });

//     if (!prResponse.ok) {
//       console.error(`Failed to fetch PR data: ${prResponse.status} ${prResponse.statusText}`);
//       return null;
//     }

//     const prData = await prResponse.json();

//     // PRのファイル情報を取得
//     const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
//       headers,
//     });

//     if (!filesResponse.ok) {
//       console.error(`Failed to fetch PR files: ${filesResponse.status} ${filesResponse.statusText}`);
//       return null;
//     }

//     const filesData = await filesResponse.json();

//     // データを整形して返す
//     return {
//       ...prData,
//       files: filesData,
//     };
//   } catch (error) {
//     console.error('Error fetching PR data:', error);
//     return null;
//   }
// };

// PRデータを管理するためのカスタムフック
export function usePRData() {
  const [prData, setPRData] = useState<PRData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PRAnalysisResult | undefined>(undefined);
  const [currentPage] = useAtom(currentPageAtom);

  // PR情報を取得する関数
  useEffect(() => {
    const loadPRData = async () => {
      // URLが設定されていない場合は何もしない
      if (!currentPage?.url) return;

      // URLからPR識別子を抽出
      const identifier = extractPRIdentifier(currentPage.url);
      if (!identifier) {
        console.log('Not a PR URL, skipping data loading:', currentPage.url);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // PRキーの作成（関数の使用例として）
        const prKey = generatePRKey(currentPage.url);
        console.log('Using PR key:', prKey);

        // まずストレージからデータを取得してみる
        const savedData = await prDataStorage.getFromStorage(currentPage.url);

        if (savedData) {
          // 保存されたデータがある場合はそれを使用
          setPRData(savedData.data);
          if (savedData.analysisResult) {
            setAnalysisResult(savedData.analysisResult);
          }
          console.log('Loaded PR data from storage:', currentPage.url);
        } else {
          // なければAPIから取得
          console.log('Fetching PR data from API:', currentPage.url);
          const newData = await fetchPRData(identifier);

          if (newData) {
            setPRData(newData);
            // データをストレージに保存
            await prDataStorage.saveToStorage(currentPage.url, newData);
          } else {
            setError('Failed to load PR data');
          }
        }
      } catch (err) {
        console.error('Error in loadPRData:', err);
        setError('An error occurred while loading PR data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPRData();
  }, [currentPage?.url]);

  // 分析結果を保存する関数
  const saveAnalysisResult = async (result: PRAnalysisResult | undefined) => {
    if (!prData || !currentPage?.url) return;

    setAnalysisResult(result);

    try {
      await prDataStorage.saveToStorage(currentPage.url, prData, result);
    } catch (err) {
      console.error('Error saving analysis result:', err);
    }
  };

  // データを強制的に再読み込みする関数
  const refreshData = async () => {
    if (!currentPage?.url) return;

    const identifier = extractPRIdentifier(currentPage.url);
    if (!identifier) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchPRData(identifier);

      if (newData) {
        setPRData(newData);
        // 既存の分析結果を保持したまま、新しいデータを保存
        await prDataStorage.saveToStorage(currentPage.url, newData, analysisResult || undefined);
      } else {
        setError('Failed to refresh PR data');
      }
    } catch (err) {
      console.error('Error in refreshData:', err);
      setError('An error occurred while refreshing PR data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    prData,
    isLoading,
    error,
    analysisResult,
    saveAnalysisResult,
    refreshData,
    currentPage,
  };
}

// ファイルごとの承認状況と承認率を計算するユーティリティ関数群
// const getApprovedFiles = (prData: PRData | null, analysisResult: PRAnalysisResult | undefined): number => {
//   if (!prData || !analysisResult) return 0;

//   return prData.files.filter(file => {
//     const fileChecklist = analysisResult.fileAnalysis.find(checklist => checklist.filename === file.filename);

//     if (!fileChecklist) return false;

//     // すべてのチェックリストアイテムが'OK'になっているか確認
//     return fileChecklist.checklistItems.every(item => item.status === 'OK');
//   }).length;
// };

// // 承認率を計算するユーティリティ関数 (0-100%)
// const getApprovalPercentage = (prData: PRData | null, analysisResult: PRAnalysisResult | undefined): number | null => {
//   if (!prData || prData.files.length === 0) return null;
//   return (getApprovedFiles(prData, analysisResult) / prData.files.length) * 100;
// };

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
