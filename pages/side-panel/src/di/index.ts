/**
 * 依存性注入（DI）コンテナ
 * リポジトリ実装を注入してサービスインスタンスを作成
 */

// リポジトリ実装をインポート
import { prDataRepository } from '@src/repositories/storage/prDataRepository';
import { prChatHistoryRepository } from '@src/repositories/storage/prChatHistoryRepository';
import { recentPRRepository } from '@src/repositories/storage/recentPRRepository';

// サービスクラスをインポート
import { PRDataStorageService } from '@src/services/prDataStorageService';
import { PRChatHistoryStorageService } from '@src/services/prChatHistoryStorageService';
import { PRDataService } from '@src/services/prDataService';
import { AIService } from '@src/services/aiService';

// 外部依存をインポート
import { GithubClient } from '@src/repositories/github/github';
import { getServerIdByDomain } from '@src/utils/prUtils';
import { createModelClient } from '@src/repositories/ai/modelClient';

/**
 * PRDataStorageServiceのファクトリー関数
 * 実際のリポジトリ実装を注入してサービスインスタンスを作成
 */
export function createPRDataStorageService(): PRDataStorageService {
  return new PRDataStorageService(prDataRepository, prChatHistoryRepository, recentPRRepository);
}

/**
 * PRChatHistoryStorageServiceのファクトリー関数
 * 実際のリポジトリ実装を注入してサービスインスタンスを作成
 */
export function createPRChatHistoryStorageService(): PRChatHistoryStorageService {
  return new PRChatHistoryStorageService(prChatHistoryRepository);
}

/**
 * PRDataServiceのファクトリー関数
 * GitHubクライアントファクトリーとサーバーID取得関数を注入してサービスインスタンスを作成
 */
export function createPRDataService(): PRDataService {
  return new PRDataService(GithubClient.create, getServerIdByDomain);
}

/**
 * AIServiceのファクトリー関数
 * ModelClientファクトリーを注入してサービスインスタンスを作成
 */
export function createAIService(): AIService {
  return new AIService(createModelClient);
}

/**
 * シングルトンインスタンス
 * アプリケーション全体で共有される単一のサービスインスタンス
 */
export const prDataStorageService = createPRDataStorageService();
export const prChatHistoryStorageService = createPRChatHistoryStorageService();
export const prDataService = createPRDataService();
export const aiService = createAIService();
