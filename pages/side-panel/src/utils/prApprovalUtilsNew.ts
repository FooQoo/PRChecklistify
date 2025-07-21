import type { PRData, PRAnalysisResult } from '../types/index.js';

export const getApprovedFiles = (prData: PRData | null, analysisResult: PRAnalysisResult | null): number => {
  if (!prData || !analysisResult) return 0;

  return prData.files.filter(file => {
    const fileChecklist = analysisResult.fileAnalysis?.find(checklist => checklist.filename === file.filename);
    if (!fileChecklist) return false;

    // isClose が true の場合は承認（チェックリストアイテムが空でもOK）
    if (fileChecklist.isClose) {
      return true;
    }

    // isClose が false でもすべてのチェックリストアイテムが完了している場合は承認
    // ただし、チェックリストアイテムが空の場合は承認しない
    if (fileChecklist.checklistItems.length === 0) {
      return false;
    }

    return fileChecklist.checklistItems.every(item => item.isChecked);
  }).length;
};

export const getApprovalPercentage = (
  prData: PRData | null,
  analysisResult: PRAnalysisResult | null,
): number | null => {
  if (!prData || prData.files.length === 0) return null;
  return (getApprovedFiles(prData, analysisResult) / prData.files.length) * 100;
};
