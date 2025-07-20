# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PR Checklistify is a Chrome extension that streamlines Pull Request reviews by automatically generating checklists. It's built with React + TypeScript + Vite in a monorepo structure using Turborepo.

## Development Commands

### Environment Setup
```bash
# Install dependencies
pnpm install

# Create required .env file for side-panel
echo 'VITE_OPENAI_API_ENDPOINT=https://api.openai.com/v1' > pages/side-panel/.env
echo 'VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/' >> pages/side-panel/.env
echo 'VITE_GITHUB_API_DOMAIN=https://api.github.com' >> pages/side-panel/.env
```

### Build & Development
```bash
# Development (Chrome)
pnpm dev

# Development (Firefox)
pnpm dev:firefox

# Build (Chrome)
pnpm build

# Build (Firefox)
pnpm build:firefox

# Build production zip
pnpm zip
```

### Code Quality
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Lint with fixes
pnpm lint:fix

# Format code
pnpm prettier
```

### Testing
```bash
# Run E2E tests
pnpm e2e

# Run E2E tests for Firefox
pnpm e2e:firefox
```

### Clean Commands
```bash
# Clean build files
pnpm clean:bundle

# Clean node_modules
pnpm clean:node_modules

# Clean turbo cache
pnpm clean:turbo

# Clean all
pnpm clean
```

## Architecture

### Monorepo Structure
- **chrome-extension/**: Extension manifest and background scripts
- **pages/side-panel/**: Main React application (side panel UI)
- **packages/**: Shared libraries and utilities
- **tests/e2e/**: End-to-end tests using WebDriver

### Main Application (pages/side-panel/src/)
```
src/
├── atoms/               # Jotai atoms for state management
├── components/          # Atomic Design structure
│   ├── atoms/          # Basic UI elements (Button, TextInput, etc.)
│   ├── molecules/      # Component combinations (ApiKeySettings, etc.)
│   ├── organisms/      # Complex components (FileChecklist, PRAnalysis, etc.)
│   └── templates/      # Page-level components
├── errors/              # Custom error classes
├── hooks/               # Custom React hooks for state management
├── repositories/        # Data access layer
│   ├── ai/             # AI service implementations (OpenAI, Gemini, Claude)
│   └── github/         # GitHub API client
├── services/            # Business logic services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── views/               # Route components
```

### Key Technologies
- **React 19** with functional components and hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Jotai** for state management
- **React Router** with memory router
- **Chrome Storage API** for persistence
- **AI SDK** for OpenAI/Gemini/Claude integrations

### State Management
- Uses Jotai atoms for global state
- Storage atoms automatically sync with Chrome Storage API
- Hooks follow pattern: `use[Noun]Atom` (e.g., `useGithubTokenAtom`)
- Setters: `set[Noun]AndStorage`, Clearers: `clear[Noun]`

## Naming Conventions

### Components & Files
- **Components**: PascalCase (e.g., `SidePanel`, `FileChatModal`)
- **Files**: PascalCase for components, camelCase for services/utils
- **Atoms**: camelCase + "Atom" suffix (e.g., `currentPageAtom`)
- **Hooks**: "use" prefix (e.g., `usePRData`)
- **Routes**: lowercase with hyphens (e.g., `/github-token-setup`)

### Code Style
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Props Interfaces**: ComponentName + "Props"
- **CSS Classes**: Tailwind utility classes preferred

## AI Service Integration

The extension integrates with multiple AI providers:
- **OpenAI**: GPT models via OpenAI API
- **Gemini**: Google's AI models
- **Claude**: Anthropic's models

### Architecture
- **Repository Layer**: `repositories/ai/modelClient.ts` - Unified interface for AI providers
- **Service Layer**: `services/aiService.ts` - Business logic for AI operations using singleton pattern
- **Usage**: Import `aiService` singleton instance for all AI operations

### AI Service Methods
- `generateAnalysis()` - Generate AI analysis for PR files
- `generateChecklist()` - Generate checklists for PR files  
- `streamFileChat()` - Stream chat responses for file discussions
- `streamPRSummary()` - Stream PR summary generation

## Chrome Extension Architecture

### Background Script
- Handles extension icon clicks to open side panel
- Monitors tab changes and updates current page URL in storage
- Located in `chrome-extension/src/background/index.ts`

### Side Panel
- Main React application rendered in Chrome's side panel
- Communicates with background script via Chrome Storage API
- Handles PR analysis and checklist generation

## Development Notes

### Environment Variables
- API endpoints configurable via `.env` files
- OpenAI API compatibility for custom endpoints
- GitHub API domain configurable for enterprise instances

### Storage
- All sensitive data (API keys) stored securely via Chrome Storage API
- Never hardcode API keys in source code
- Use provided storage hooks for persistence

#### Storage Key Naming Convention
- **ALWAYS use camelCase** for all storage keys (e.g., `modelClientType`, `openaiApiKey`)
- Never use kebab-case, snake_case, or PascalCase for storage keys
- Examples of correct naming:
  - ✅ `modelClientType`
  - ✅ `openaiApiEndpoint`
  - ✅ `languagePreference`
  - ❌ `model-client-type`
  - ❌ `openai_api_endpoint`
  - ❌ `LanguagePreference`
- Storage implementations in `packages/storage/lib/impl/` should use `createStorage()` with camelCase keys
- When adding new storage, ensure the key follows this convention to maintain consistency

### Error Handling
- Components wrapped with error boundaries
- Suspense for loading states
- Graceful error handling throughout the application

### Testing
- E2E tests use WebDriver for browser automation
- Tests run against built extension in both Chrome and Firefox
- Test configuration in `tests/e2e/config/`

## Coding Standards & Best Practices

### File & Folder Organization

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