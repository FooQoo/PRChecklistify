# 依存性注入（DI）アーキテクチャ

このフォルダは、依存性注入（Dependency Injection）を管理するための専用ディレクトリです。

## 概要

サービスレイヤーから直接的なリポジトリ依存を排除し、テスタブルで保守性の高いアーキテクチャを実現しています。

## ファイル構成

```
src/di/
├── index.ts          # メインのDIコンテナ
└── README.md        # このファイル
```

## アーキテクチャの利点

### ✅ **依存関係の分離**
- サービスクラス: ビジネスロジックのみに集中
- DIコンテナ: 依存関係の組み立てを担当
- リポジトリ: データアクセスのみに集中

### ✅ **テスタビリティ向上**
- サービスクラスは完全にDI対応
- テスト時にモックを簡単に注入可能
- Node.js環境でのテスト実行が可能

### ✅ **Chrome Extension API分離**
- サービスレイヤーから@extension/storage依存を排除
- テスト環境でのChrome Extension API不要
- 型安全なインターフェースベースの設計

## 使用方法

### アプリケーションコードでの使用
```typescript
import { prDataStorageService } from '@src/di';

// シングルトンインスタンスとして使用
await prDataStorageService.savePRDataToStorage(prKey, prData);
```

### テストコードでの使用
```typescript
import { PRDataStorageService } from '@src/services/prDataStorageService';

// モックリポジトリを注入
const service = new PRDataStorageService(
  mockPRDataRepo,
  mockChatRepo,
  mockRecentRepo
);
```

## 提供される機能

- **createPRDataStorageService()**: PRDataStorageServiceのファクトリー関数
- **createPRChatHistoryStorageService()**: PRChatHistoryStorageServiceのファクトリー関数
- **prDataStorageService**: PRDataStorageServiceのシングルトンインスタンス
- **prChatHistoryStorageService**: PRChatHistoryStorageServiceのシングルトンインスタンス

## 拡張方法

新しいサービスクラスを追加する場合:

1. サービスクラスを完全DI対応で作成
2. DIコンテナにファクトリー関数を追加
3. 必要に応じてシングルトンインスタンスをエクスポート
4. 使用側のインポートを更新
