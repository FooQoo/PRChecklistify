/* eslint-disable @typescript-eslint/no-explicit-any */
import { LLMError } from '@src/errors/LLMError';
import { GitHubError } from '@src/errors/GitHubError';

/**
 * エラーメッセージを国際化対応で取得する関数（Hookを使わない版）
 */
export function getLocalizedErrorMessage(error: unknown, t: (key: any) => string): string {
  // LLMError の場合は i18nKey を使用
  if (LLMError.isLLMError(error)) {
    return t(error.i18nKey);
  }

  // GitHubError の場合は i18nKey を使用
  if (GitHubError.isGitHubError(error)) {
    // レート制限エラーの場合はリセット時刻も含める
    if (error.i18nKey === 'githubRateLimitError' && error.resetTime) {
      const resetTimeString = error.resetTime.toLocaleString();
      return `${t(error.i18nKey)}\n${t('rateLimitResetTime').replace('$1', resetTimeString)}`;
    }
    return t(error.i18nKey);
  }

  return t('error');
}
