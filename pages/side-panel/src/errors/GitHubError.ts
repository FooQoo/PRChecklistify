/**
 * GitHub API処理に関する独自例外クラス
 * i18nキーをフィールドとして持ち、表示時に適切にローカライズされる
 */
export class GitHubError extends Error {
  public readonly i18nKey: string;
  public readonly originalError?: unknown;
  public readonly resetTime?: Date;

  constructor(i18nKey: string, originalError?: unknown, message?: string, resetTime?: Date) {
    super(message || i18nKey);
    this.name = 'GitHubError';
    this.i18nKey = i18nKey;
    this.originalError = originalError;
    this.resetTime = resetTime;

    // Error.captureStackTraceが利用可能な場合（Node.js環境など）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GitHubError);
    }
  }

  static create(error: unknown): GitHubError {
    if (GitHubError.isGitHubError(error)) {
      return error;
    }

    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      return GitHubError.createTokenInvalidError(error);
    } else if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
      return GitHubError.createRepositoryAccessError(error);
    } else if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return GitHubError.createFileNotFoundError(error);
    } else if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return GitHubError.createRateLimitError(error);
    } else if (error && typeof error === 'object' && 'status' in error) {
      return GitHubError.createApiError(error);
    }
    return GitHubError.createApiError(error);
  }

  /**
   * GitHubトークンが無効なエラーを作成
   */
  static createTokenInvalidError(originalError?: unknown): GitHubError {
    return new GitHubError('githubTokenInvalid', originalError);
  }

  /**
   * GitHubサーバー設定が見つからないエラーを作成
   */
  static createServerConfigNotFoundError(): GitHubError {
    return new GitHubError('githubServerConfigNotFound');
  }

  /**
   * GitHub API レート制限エラーを作成
   */
  static createRateLimitError(originalError?: unknown): GitHubError {
    let resetTime: Date | undefined;

    // GitHub APIのレスポンスヘッダーからリセット時刻を取得
    if (originalError && typeof originalError === 'object' && 'headers' in originalError && originalError.headers) {
      const headers = originalError.headers as Record<string, string>;
      const resetTimestamp = headers['x-ratelimit-reset'];
      if (resetTimestamp) {
        resetTime = new Date(parseInt(resetTimestamp) * 1000);
      }
    }

    return new GitHubError('githubRateLimitError', originalError, undefined, resetTime);
  }

  /**
   * GitHub API ネットワークエラーを作成
   */
  static createNetworkError(originalError?: unknown): GitHubError {
    return new GitHubError('githubNetworkError', originalError);
  }

  /**
   * リポジトリアクセス権限エラーを作成
   */
  static createRepositoryAccessError(originalError?: unknown): GitHubError {
    return new GitHubError('githubRepositoryAccessDenied', originalError);
  }

  /**
   * プルリクエストが見つからないエラーを作成
   */
  static createPullRequestNotFoundError(originalError?: unknown): GitHubError {
    return new GitHubError('githubPullRequestNotFound', originalError);
  }

  /**
   * ファイルが見つからないエラーを作成
   */
  static createFileNotFoundError(originalError?: unknown): GitHubError {
    return new GitHubError('githubFileNotFound', originalError);
  }

  /**
   * 一般的なGitHub APIエラーを作成
   */
  static createApiError(originalError?: unknown): GitHubError {
    return new GitHubError('githubApiError', originalError);
  }

  /**
   * この例外がGitHubErrorかどうかを判定
   */
  static isGitHubError(error: unknown): error is GitHubError {
    return error instanceof GitHubError;
  }
}
