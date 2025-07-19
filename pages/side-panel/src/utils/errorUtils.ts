import { LLMError } from '@src/errors/LLMError';

/**
 * エラーメッセージを国際化対応で取得する関数（Hookを使わない版）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedErrorMessage(error: unknown, t: (key: any) => string): string {
  // LLMError の場合は i18nKey を使用
  if (LLMError.isLLMError(error)) {
    return t(error.i18nKey);
  }

  return t('error');
}
