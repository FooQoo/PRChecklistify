import type { PRData, PRAnalysisResult, Checklist, ChecklistItem } from '../types/index.js';

/**
 * PRDataから初期状態のPRAnalysisResultを作成する
 * すべてのファイルに対してChecklistを初期状態で生成する
 */
export const createInitialPRAnalysisResult = (prData: PRData): PRAnalysisResult => {
  const fileAnalysis: Checklist[] = prData.files.map(file => ({
    filename: file.filename,
    explanation: undefined, // 初期状態はundefined
    checklistItems: [], // 初期状態は空配列
    isClose: false, // 初期状態はfalse
  }));

  return {
    summary: undefined, // 初期状態はundefined
    fileAnalysis,
  };
};

/**
 * 既存のPRAnalysisResultに新しいファイルを追加する
 * PRのファイルリストが更新された時に使用
 */
export const updatePRAnalysisResultWithNewFiles = (
  prData: PRData,
  existingResult: PRAnalysisResult,
): PRAnalysisResult => {
  const existingFilenames = new Set(existingResult.fileAnalysis.map(item => item.filename));

  // 新しいファイルのみを追加
  const newFileAnalysis = prData.files
    .filter(file => !existingFilenames.has(file.filename))
    .map(file => ({
      filename: file.filename,
      explanation: undefined,
      checklistItems: [],
      isClose: false,
    }));

  return {
    ...existingResult,
    fileAnalysis: [...existingResult.fileAnalysis, ...newFileAnalysis],
  };
};

/**
 * ファイルのisCloseフラグを更新する
 */
export const updateFileCloseStatus = (
  analysisResult: PRAnalysisResult,
  filename: string,
  isClose: boolean,
): PRAnalysisResult => {
  return {
    ...analysisResult,
    fileAnalysis: analysisResult.fileAnalysis.map(item => (item.filename === filename ? { ...item, isClose } : item)),
  };
};

/**
 * ファイルのチェックリストを更新する
 */
export const updateFileChecklist = (
  analysisResult: PRAnalysisResult,
  filename: string,
  explanation: string,
  checklistItems: ChecklistItem[],
): PRAnalysisResult => {
  return {
    ...analysisResult,
    fileAnalysis: analysisResult.fileAnalysis.map(item =>
      item.filename === filename ? { ...item, explanation, checklistItems } : item,
    ),
  };
};
