import type { PRData } from '../types';

export const calculateReviewTime = (prData: PRData): { minutes: number } => {
  const totalFiles = prData.files.length;
  const totalChanges = prData.files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  let minutes = 0;
  if (totalChanges < 100 && totalFiles < 5) {
    minutes = Math.max(5, Math.ceil(totalChanges / 10));
  } else if (totalChanges < 500 && totalFiles < 20) {
    minutes = Math.max(10, Math.ceil(totalChanges / 8));
  } else {
    minutes = Math.max(30, Math.ceil(totalChanges / 5));
  }
  return { minutes };
};
