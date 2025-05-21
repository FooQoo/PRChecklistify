import type { PRData, PRAnalysisResult } from '../types';

export const getApprovedFiles = (prData: PRData | null, analysisResult: PRAnalysisResult | undefined): number => {
  if (!prData || !analysisResult) return 0;
  return prData.files.filter(file => {
    const fileChecklist = analysisResult.fileAnalysis.find(checklist => checklist.filename === file.filename);
    if (!fileChecklist) return false;
    return fileChecklist.checklistItems.every(item => item.status === 'OK');
  }).length;
};

export const getApprovalPercentage = (
  prData: PRData | null,
  analysisResult: PRAnalysisResult | undefined,
): number | null => {
  if (!prData || prData.files.length === 0) return null;
  return (getApprovedFiles(prData, analysisResult) / prData.files.length) * 100;
};
