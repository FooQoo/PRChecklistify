/**
 * LLM処理に関する独自例外クラス
 * i18nキーをフィールドとして持ち、表示時に適切にローカライズされる
 */
export class LLMError extends Error {
  public readonly i18nKey: string;
  public readonly originalError?: unknown;

  constructor(i18nKey: string, originalError?: unknown, message?: string) {
    super(message || i18nKey);
    this.name = 'LLMError';
    this.i18nKey = i18nKey;
    this.originalError = originalError;

    // Error.captureStackTraceが利用可能な場合（Node.js環境など）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LLMError);
    }
  }

  static createApiKeyNotFoundError(): LLMError {
    return new LLMError('apiKeyNotFound');
  }

  /**
   * APIキー不正エラーを作成
   */
  static createAPIKeyError(originalError?: unknown): LLMError {
    return new LLMError('apiKeyInvalid', originalError);
  }

  /**
   * 一般的なLLMサービスエラーを作成
   */
  static createServiceError(originalError?: unknown): LLMError {
    return new LLMError('llmServiceError', originalError);
  }

  /**
   * この例外がLLMErrorかどうかを判定
   */
  static isLLMError(error: unknown): error is LLMError {
    return error instanceof LLMError;
  }
}
