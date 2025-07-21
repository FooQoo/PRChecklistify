# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドラインを提供します。

## 概要

PR Checklistify は、プルリクエストのレビューを効率化する Chrome 拡張機能です。チェックリストを自動生成し、レビュー漏れを防ぎます。React と TypeScript、Vite を用い、Turborepo によるモノレポ構成で構築されています。

## 開発コマンド

### 環境構築
```bash
# 依存関係のインストール
pnpm install

# サイドパネル用の .env ファイルを作成
echo 'VITE_OPENAI_API_ENDPOINT=https://api.openai.com/v1' > pages/side-panel/.env
echo 'VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/' >> pages/side-panel/.env
echo 'VITE_GITHUB_API_DOMAIN=https://api.github.com' >> pages/side-panel/.env
```

### ビルドと開発
```bash
# 開発用 (Chrome)
pnpm dev

# 開発用 (Firefox)
pnpm dev:firefox

# ビルド (Chrome)
pnpm build

# ビルド (Firefox)
pnpm build:firefox

# プロダクション用 zip を作成
pnpm zip
```

### コード品質チェック
```bash
# 型チェック
pnpm type-check

# Lint 実行
pnpm lint

# 自動修正付き Lint
pnpm lint:fix

# コード整形
pnpm prettier
```

### テスト
```bash
# E2E テスト実行
pnpm e2e

# Firefox 向け E2E テスト実行
pnpm e2e:firefox
```

### クリーンコマンド
```bash
# ビルド成果物の削除
pnpm clean:bundle

# node_modules の削除
pnpm clean:node_modules

# Turbo キャッシュの削除
pnpm clean:turbo

# 全て削除
pnpm clean
```

## アーキテクチャ

### モノレポ構成
- **chrome-extension/**: 拡張機能のマニフェストとバックグラウンドスクリプト
- **pages/side-panel/**: メインの React アプリケーション（サイドパネル UI）
- **packages/**: 共有ライブラリとユーティリティ
- **tests/e2e/**: WebDriver を用いた E2E テスト

### メインアプリケーション (pages/side-panel/src/)
```
src/
├── atoms/               # Jotai の状態管理用アトム
├── components/          # Atomic Design 構造
│   ├── atoms/          # 基本的な UI 要素 (Button, TextInput など)
│   ├── molecules/      # コンポーネントの組み合わせ (ApiKeySettings など)
│   ├── organisms/      # 複雑なコンポーネント (FileChecklist, PRAnalysis など)
│   └── templates/      # ページレベルのコンポーネント
├── errors/              # カスタムエラークラス
├── hooks/               # 状態管理用の React フック
├── repositories/        # データアクセス層
│   ├── ai/             # AI サービス実装 (OpenAI, Gemini, Claude)
│   └── github/         # GitHub API クライアント
├── services/            # ビジネスロジックサービス
├── types/               # TypeScript 型定義
├── utils/               # ユーティリティ関数
└── views/               # ルートコンポーネント
```

### 主な技術
- **React 19**: 関数コンポーネントとフック
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: スタイリング
- **Jotai**: 状態管理
- **React Router**: メモリルーター
- **Chrome Storage API**: 永続化
- **AI SDK**: OpenAI/Gemini/Claude 連携

### 状態管理
- グローバル状態には Jotai のアトムを使用
- ストレージアトムは自動的に Chrome Storage API と同期
- フックは `use[Noun]Atom` パターンで命名（例: `useGithubTokenAtom`）
- セッターは `set[Noun]AndStorage`、クリアは `clear[Noun]`

## 命名規則

### コンポーネントとファイル
- **コンポーネント**: PascalCase（例: `SidePanel`, `FileChatModal`）
- **ファイル**: コンポーネントは PascalCase、サービスやユーティリティは camelCase
- **アトム**: camelCase + "Atom" サフィックス（例: `currentPageAtom`）
- **フック**: "use" プレフィックス（例: `usePRData`）
- **ルート**: ケバブケース（例: `/github-token-setup`）

### コードスタイル
- **関数・変数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **Props インターフェース**: ComponentName + "Props"
- **CSS クラス**: Tailwind のユーティリティクラスを推奨

## AI サービス統合

この拡張機能は複数の AI プロバイダーを利用できます:
- **OpenAI**: OpenAI API 経由の GPT モデル
- **Gemini**: Google の AI モデル
- **Claude**: Anthropic のモデル

### アーキテクチャ
- **リポジトリ層**: `repositories/ai/modelClient.ts` - 各 AI プロバイダーを統合するインターフェース
- **サービス層**: `services/aiService.ts` - シングルトンパターンで AI 処理を提供
- **使用方法**: すべての AI 操作で `aiService` シングルトンをインポート

### AI サービスメソッド
- `generateAnalysis()` - PR ファイルの解析を生成
- `generateChecklist()` - PR ファイルのチェックリストを生成
- `streamFileChat()` - ファイルディスカッションのチャットをストリーミング
- `streamPRSummary()` - PR サマリーをストリーミング生成

## Chrome 拡張機能の構成

### バックグラウンドスクリプト
- 拡張機能アイコンのクリックでサイドパネルを開く
- タブ変更を監視して現在のページ URL をストレージに保存
- `chrome-extension/src/background/index.ts` に配置

### サイドパネル
- Chrome のサイドパネルに表示されるメインの React アプリケーション
- Chrome Storage API を介してバックグラウンドスクリプトと通信
- PR 解析とチェックリスト生成を担当

## 開発ノート

### 環境変数
- API エンドポイントは `.env` で設定可能
- OpenAI API 互換のカスタムエンドポイントに対応
- GitHub Enterprise 用に API ドメインを設定可能

### ストレージ
- API キーなどの機密データは Chrome Storage API で安全に保存
- ソースコードに API キーをハードコードしない
- 永続化には提供されているストレージフックを使用

#### ストレージキーの命名規則
- **必ず camelCase** を使用（例: `modelClientType`, `openaiApiKey`）
- kebab-case、snake_case、PascalCase は使用しない
- 正しい例:
  - ✅ `modelClientType`
  - ✅ `openaiApiEndpoint`
  - ✅ `languagePreference`
  - ❌ `model-client-type`
  - ❌ `openai_api_endpoint`
  - ❌ `LanguagePreference`
- `packages/storage/lib/impl/` 内の実装では camelCase キーで `createStorage()` を使用
- 新しいストレージを追加する際もこの規則を守ること

### エラーハンドリング
- コンポーネントはエラーバウンダリでラップする
- ローディング状態には Suspense を使用
- アプリ全体で丁寧なエラーハンドリングを行う

### テスト
- E2E テストは WebDriver を用いたブラウザー自動化
- Chrome と Firefox のビルド済み拡張でテストを実行
- 設定ファイルは `tests/e2e/config/` に配置

## コーディング規約とベストプラクティス

### ファイルとフォルダの構成

#### Component Structure (pages/side-panel/src/components/)
```
components/
├── atoms/              # 最小単位のUIコンポーネント
│   ├── Button.tsx      # 再利用可能な基本コンポーネント
│   ├── TextInput.tsx   # フォーム要素
│   └── index.ts        # 必須：すべてのatomsをexport
├── molecules/          # atomsを組み合わせた機能単位
│   ├── ChecklistComponent.tsx  # 機能的なコンポーネント
│   └── index.ts        # 必須：すべてのmoleculesをexport
├── organisms/          # 複雑なビジネスロジックを持つコンポーネント
│   ├── PRAnalysis.tsx  # ページレベルの機能
│   └── index.ts        # 必須：すべてのorganismsをexport
└── templates/          # レイアウト・ページテンプレート
    ├── Layout.tsx      # ページ全体のレイアウト
    └── index.ts        # 必須：すべてのtemplatesをexport
```

**規約:**
- 各レベルに`index.ts`を配置し、すべてのコンポーネントをexport
- アトミックデザインの階層を厳密に守る
- ファイル名はPascalCase、コンポーネント名と一致させる

#### Repositories Structure (pages/side-panel/src/repositories/)
```
repositories/
├── ai/                 # AIサービス実装
│   ├── claude.ts       # Claude APIクライアント
│   ├── gemini.ts       # Gemini APIクライアント
│   ├── modelClient.ts  # AIサービス統合レイヤー
│   └── openai.ts       # OpenAI APIクライアント
└── github/
    └── github.ts       # GitHub APIクライアント
```

#### Services Structure (pages/side-panel/src/services/)
```
services/
├── aiService.ts               # AI operations (singleton class-based service)
├── prChatHistoryService.ts    # PRチャット履歴管理
└── prDataService.ts           # PRデータ処理サービス
```

**規約:**
- **Repositories**: データアクセス層、外部APIとの通信を担当
- **Services**: ビジネスロジック、repositoriesを使用してアプリケーションロジックを実装
- クラスベースの実装を推奨
- エラーハンドリングはカスタムエラークラスを使用
- static createメソッドでインスタンス生成

#### Hooks Structure (pages/side-panel/src/hooks/)
```
hooks/
├── useGithubTokensAtom.ts  # 状態管理フック
├── usePRData.ts           # データフェッチフック
└── prDataLoader.ts        # ユーティリティフック
```

**規約:**
- ファイル名は`use[名詞]Atom.ts`パターン
- Jotai atomsとの統合を基本とする
- storageとの同期を含む場合は明示的に記述

#### Utils Structure (pages/side-panel/src/utils/)
```
utils/
├── prUtils.ts        # PR関連のユーティリティ
├── errorUtils.ts     # エラー処理ユーティリティ
└── envUtils.ts       # 環境変数関連
```

**規約:**
- 純粋関数として実装
- 1ファイル1テーマで分割
- export defaultではなく名前付きexportを使用

### Component Design Patterns

#### React Component Template
```typescript
// 良い例
import type React from 'react';
import { useState } from 'react';
import type { ComponentProps } from '../types';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}) => {
  // Implementation
  return <button>{children}</button>;
};

export default Button;
```

**必須パターン:**
- `React.FC<PropsType>`で型定義
- Props interfaceは`ComponentName + "Props"`
- デフォルト値はデストラクチャリング時に設定
- `export default`を使用

#### Custom Hook Template
```typescript
// 良い例
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { storageService } from '@extension/storage';

export const dataAtom = atom<DataType | undefined>(undefined);

export function useDataAtom() {
  const [data, setData] = useAtom(dataAtom);
  
  useEffect(() => {
    let mounted = true;
    // 初期化ロジック
    return () => { mounted = false; };
  }, []);

  const updateData = async (newData: DataType) => {
    await storageService.set(newData);
    setData(newData);
  };

  return {
    data,
    updateData,
    // その他必要なメソッド
  } as const;
}
```

#### Service Class Template
```typescript
// 良い例
import { CustomError } from '@src/errors/CustomError';

export class ServiceClass {
  private client: ClientType;
  
  private constructor(client: ClientType) {
    this.client = client;
  }
  
  static async create(config: ConfigType): Promise<ServiceClass> {
    // 初期化ロジック
    const client = await initializeClient(config);
    return new ServiceClass(client);
  }
  
  private handleError(error: unknown): never {
    // エラーハンドリングロジック
    throw CustomError.createFromError(error);
  }
  
  async publicMethod(): Promise<ReturnType> {
    try {
      // 実装
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### TypeScript Guidelines

#### Type Definition Standards
```typescript
// 良い例：詳細な型定義
export interface PRData {
  id: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  files: PRFile[];
  // 必須フィールドは？をつけない
  // オプショナルフィールドは？をつける
  description?: string;
}

// 良い例：Union Types
export type ModelProvider = 'openai' | 'gemini' | 'claude';

// 良い例：Generic Types
export interface Storage<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
}
```

#### Import/Export Standards
```typescript
// ✅ 推奨：絶対パス（@srcまたはエイリアス）
import type React from 'react';
import type { ComponentProps } from '@src/types';
import { useState } from 'react';
import { Button } from '@src/components/atoms';
import { useI18n } from '@extension/i18n';

// ✅ 型のimportには明示的にtype修飾子を使用
import type { Checklist } from '@src/types';

// ✅ indexファイルでの集約export
export { default as Button } from './Button';
export { default as TextInput } from './TextInput';

// ❌ 避けるべき：相対パス（深いディレクトリ構造の場合）
import { ComponentProps } from '../../../types';
import { Button } from '../atoms';
```

#### Import/Export Guidelines
- **絶対パス優先**: `@src`、`@extension`等のエイリアスを活用
- **相対パス使用可能**: 同一フォルダまたは1階層以内の場合のみ
- **型Import**: `import type`を明示的に使用
- **名前付きexport**: デフォルトexportより推奨（index.tsファイル以外）

### Code Quality Standards

#### 禁止事項 (Dos and Don'ts)

**❌ 避けるべきパターン:**
```typescript
// ❌ any型の使用
const data: any = response;

// ❌ eslint-disable の多用
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// ❌ 長すぎるコンポーネント（200行超）
const HugeComponent = () => {
  // 200行以上のコード
};

// ❌ 複数の責務を持つコンポーネント
const UserFormWithValidationAndApiCall = () => {};

// ❌ kebab-caseのstorage key
createStorage('user-profile-data', defaultValue);

// ❌ マジックナンバー
setTimeout(callback, 5000);
```

**✅ 推奨パターン:**
```typescript
// ✅ 明確な型定義
const data: ResponseType = response;

// ✅ 適切なサイズのコンポーネント（100行以下）
const FocusedComponent: React.FC<Props> = () => {
  // 単一責務の実装
};

// ✅ 単一責務の原則
const UserForm: React.FC<UserFormProps> = () => {};
const useValidation = () => {};
const useApiCall = () => {};

// ✅ camelCaseのstorage key
createStorage('userProfileData', defaultValue);

// ✅ 定数の定義
const TIMEOUT_DURATION = 5000;
setTimeout(callback, TIMEOUT_DURATION);
```

#### Performance & Optimization
```typescript
// ✅ 適切なメモ化
const MemoizedComponent = React.memo(ExpensiveComponent);

// ✅ useCallbackの適切な使用
const handleClick = useCallback(() => {
  // ハンドラー実装
}, [dependency]);

// ✅ 条件付きレンダリング
{isVisible && <Component />}

// ✅ 適切なkey属性
{items.map(item => <Item key={item.id} {...item} />)}
```

### Package-specific Guidelines

#### Storage Package (`packages/storage/`)
- すべてのキーはcamelCaseで統一
- `createStorage()`を基本として使用
- 型安全性を保つため、適切な型定義を必須とする
- デフォルト値を明確に定義

#### Shared Package (`packages/shared/`)
- HOCパターンでコンポーネントを拡張
- 共通のhooksを提供
- クロスパッケージの型定義を管理

#### I18n Package (`packages/i18n/`)
- 多言語対応は`useI18n`hookを使用
- 翻訳キーはdot notation（例：`user.profile.name`）
- 動的な値は適切にパラメータ化
- **UI実装時のi18n対応**: 新しいUIコンポーネントを追加するときは、表示される全てのテキストに対してi18n対応を同時に実装する

## Development Philosophy & Best Practices

### Core Principles

1. **型安全性を最優先**
   - TypeScriptの恩恵を最大限活用
   - any型の使用は絶対に避ける
   - 明示的な型定義を心がける

2. **単一責任の原則 (SRP)**
   - 1つのコンポーネント・関数は1つの責務のみ
   - 100行を超えるコンポーネントは分割を検討
   - 関数は可能な限り純粋関数として実装

3. **再利用性の重視**
   - Atomic Designパターンを活用
   - 共通のロジックは適切にpackagesに抽出
   - インターフェースを適切に設計

4. **保守性を考慮した設計**
   - 明確なファイル・フォルダ構造
   - 適切な命名規則の遵守
   - 十分なドキュメント

### Development Workflow

#### コード作成フロー
1. **要件の明確化** → 何を作るか、どこに配置するかを決定
2. **型定義の作成** → まずTypeScriptの型を定義
3. **実装** → 型に従って実装
4. **テスト** → 動作確認
5. **リファクタリング** → コード品質の向上

#### コードレビューのポイント
- [ ] 型安全性は保たれているか
- [ ] 命名規則に従っているか
- [ ] Atomic Designの階層は適切か
- [ ] 単一責任の原則は守られているか
- [ ] 再利用可能な設計になっているか
- [ ] エラーハンドリングは適切か
- [ ] パフォーマンスの考慮はされているか

### Code Quality Metrics

#### 品質の指標
- **TypeScript Strict Mode**: 必須
- **ESLint エラー**: 0個
- **コンポーネントサイズ**: 100行以下推奨
- **関数の複雑度**: 10以下推奨
- **Import深度**: 3階層以下推奨

#### 継続的改善
```bash
# 品質チェックのためのコマンド
pnpm type-check    # 型チェック
pnpm lint          # Lintチェック  
pnpm prettier      # フォーマットチェック
```

### Security Guidelines

#### Chrome Extension固有の注意点
- API keyは必ずChrome Storage APIで管理
- コードにsensitive dataを埋め込まない
- CSP (Content Security Policy) に従った実装
- 外部APIへの通信は適切に検証

#### データ保護
- ユーザーデータの最小限の収集
- 適切な暗号化の実装
- ログにsensitive dataを出力しない

### Future Considerations

#### 拡張性の確保
- 新しいAIプロバイダーの追加を考慮した設計
- 新機能追加時の影響範囲の最小化
- モジュールの独立性の維持

#### メンテナンス性
- 定期的な依存関係の更新
- レガシーコードの段階的な改善
- パフォーマンスモニタリング

### Quick Reference

#### 新しいコンポーネントを作る時
1. Atomic Designのどの階層か決定
2. 適切なフォルダに配置
3. Props interfaceを`ComponentName + "Props"`で定義
4. `React.FC<PropsType>`で実装
5. `index.ts`に追加

#### 新しいhookを作る時
1. `use`で始まる命名
2. Jotai atomsとの統合を検討
3. `as const`でreturn typeを固定
4. storageとの同期が必要な場合は明示的に実装

#### 新しいrepository/serviceを作る時
1. **Repository**: データアクセス層、外部API通信を担当
2. **Service**: ビジネスロジック、repositoryを使用してアプリケーションロジックを実装
3. クラスベースで実装
4. `static create`メソッドでインスタンス化
5. エラーハンドリングを統一
6. 適切な型定義を提供

---

*このドキュメントは継続的に更新されます。新しいパターンや規約が確立された際は、必ずこのファイルを更新してください。*