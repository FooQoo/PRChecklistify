# Components Architecture (Atomic Design)

このプロジェクトのコンポーネントは、Atomic Design の原則に基づいて整理されています。

## 構造

```
components/
├── atoms/          # 最小の機能単位
├── molecules/      # 複数のatomsを組み合わせた小さな機能単位
├── organisms/      # 複数のmoleculesを組み合わせた大きな機能単位
├── templates/      # レイアウトやページ構造
└── index.ts        # 全コンポーネントのエクスポート
```

## Atoms (最小の機能単位)
- `Button.tsx` - 基本的なボタンコンポーネント
- `TextInput.tsx` - テキスト入力コンポーネント
- `SecretKeyInput.tsx` - パスワード/秘密鍵入力コンポーネント
- `Toast.tsx` - 通知メッセージコンポーネント
- `SettingsButton.tsx` - 設定ボタンコンポーネント

## Molecules (複数のatomsを組み合わせた小さな機能単位)
- `ApiKeySettings.tsx` - API キー設定の共通コンポーネント
- `SettingSection.tsx` - 設定セクション用コンポーネント
- `MarkdownRenderer.tsx` - Markdown表示コンポーネント
- `ChecklistComponent.tsx` - チェックリスト表示コンポーネント

## Organisms (複数のmoleculesを組み合わせた大きな機能単位)
- `OpenAIKeySettings.tsx` - OpenAI API キー設定
- `GeminiKeySettings.tsx` - Gemini API キー設定
- `ClaudeKeySettings.tsx` - Claude API キー設定
- `GitHubIntegrationSettings.tsx` - GitHub統合設定
- `InstructionPathSettings.tsx` - 指示パス設定
- `StorageManagement.tsx` - ストレージ管理
- `FileChecklist.tsx` - ファイル毎のチェックリスト
- `FileChatModal.tsx` - ファイルチャットモーダル
- `PRAnalysis.tsx` - PR分析メイン画面

## Templates (レイアウトやページ構造)
- `Header.tsx` - ヘッダーコンポーネント
- `Footer.tsx` - フッターコンポーネント
- `UnifiedApiKeySetupView.tsx` - 統合API設定ビュー

## 使用方法

各階層のコンポーネントは、適切なindex.tsファイルからエクスポートされているため、以下のようにインポートできます：

```typescript
// 個別インポート
import { Button, TextInput } from '../components/atoms';
import { MarkdownRenderer } from '../components/molecules';
import { PRAnalysis } from '../components/organisms';

// 統合インポート
import { Button, MarkdownRenderer, PRAnalysis } from '../components';
```

この構造により、コンポーネントの再利用性が向上し、保守性が高まります。

-   Component file names are written in PascalCase (e.g., `FileChatModal.tsx`).
-   Props interfaces are named after the component, suffixed with `Props` (e.g., `FileChatModalProps`).
-   CSS class names follow the BEM (Block, Element, Modifier) methodology for better maintainability and readability.

## Design Policy

-   Components are designed to be modular and reusable.
-   UI elements follow a consistent design language to ensure a cohesive user experience.
-   Components prioritize accessibility and responsiveness.

## Technologies and Libraries Used

-   **React:** A JavaScript library for building user interfaces.
-   **TypeScript:** A typed superset of JavaScript that enhances code quality and maintainability.
-   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
-   **Jotai:** Primitive and flexible state management for React.
-   **React Markdown:** A component for rendering Markdown content in React applications.
-   **remark-gfm:** Remark plugin to support GitHub Flavored Markdown.

## File Roles

| File Name                       | Role                                                                                                                           | Logic and Functions                                                                                                                                                                                                                                                                                                                            | Names of Other Files Used                                                                                                                                                                                                                                   |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FileChatModal.tsx`             | Displays a modal for chatting about a specific file in the PR.                                                               | Manages the chat input, streaming AI responses (from either OpenAI or Gemini), displaying chat history, handling checklist interactions, and scrolling to the bottom of the chat on updates. Supports aborting in-flight requests.                                                                                                    | `MarkdownRenderer.tsx`, `../types`                                                                                                                                                                                                                         |
| `FileChecklist.tsx`             | Displays a checklist for a specific file in the PR, allowing users to review and mark items as OK or NG.                      | Fetches and displays checklist items, handles state toggling (PENDING, OK, NG), and communicates changes to the parent component. Includes logic for generating checklists with AI (OpenAI or Gemini). Renders file diffs in GitHub style. Manages the expanded/collapsed state of the checklist based on user interaction and review status. | `MarkdownRenderer.tsx`, `../types`, `@src/atoms/generatingAtom`, `@src/services/aiService`, `@extension/storage`                                                                                                                                            |
| `GeminiKeySettings.tsx`           | Component for storing and managing the Gemini API key.                                                                       | Provides a form for saving and removing the Gemini API key. Uses the `useGeminiKeyAtom` hook to manage the key's state and persists the key in chrome storage.                                                                                                                                                                         | `@src/hooks/useGeminiKeyAtom`                                                                                                                                                                                                                            |
| `GitHubIntegrationSettings.tsx`   | Component for managing GitHub API token and endpoint settings.                                                               | Provides forms for saving and removing the GitHub API token and endpoint. Uses `useGithubTokenAtom` and `useGithubApiDomainAtom` hooks to manage the token and endpoint state. Includes validation logic and persists the configuration in chrome storage.                                                                      | `../hooks/useGithubTokenAtom`, `../hooks/useGithubApiDomainAtom`, `@extension/i18n`                                                                                                                                                              |
| `Header.tsx`                    | Displays the header of the side panel.                                                                                         | Simple component that renders the title "PR Checklistify".                                                                                                                                                                                                                                                                          | None                                                                                                                                                                                                                                                        |
| `MarkdownRenderer.tsx`          | Renders Markdown content using the `react-markdown` library.                                                                   | Uses `react-markdown` and `remark-gfm` to render Markdown with GitHub Flavored Markdown support. Provides custom components for headings, lists, links, blockquotes, code blocks, tables, and horizontal rules, enhancing the rendering of Markdown content.                                                                      | None                                                                                                                                                                                                                                                        |
| `OpenAIKeySettings.tsx`           | Component for storing and managing the OpenAI API key and endpoint.                                                           | Provides a form for saving and removing the OpenAI API key and custom endpoint. Uses `useOpenaiKeyAtom` and `useOpenaiDomainAtom` hooks to manage the key and endpoint state and persists the configuration in chrome storage.                                                                                                 | `../hooks/useOpenaiKeyAtom`, `../hooks/useOpenaiDomainAtom`, `@extension/i18n`                                                                                                                                                                        |
| `PRAnalysis.tsx`                | Orchestrates the PR analysis process, displaying the summary and file checklists.                                               | Fetches PR data, generates summaries (OpenAI or Gemini), handles checklist changes, and manages the file chat modal. Uses `FileChatModal` and `FileChecklist` components to display the analysis results. Persists chat histories in local storage.                                                                            | `./FileChatModal.tsx`, `./FileChecklist.tsx`, `@src/atoms/generatingAtom`, `../types`, `@extension/storage`, `@src/services/aiService`, `./MarkdownRenderer.tsx`                                                                                 |
| `SettingsButton.tsx`              | Displays a button that navigates the user to the settings page.                                                               | Uses the `useNavigation` context to navigate to the settings page when the button is clicked.                                                                                                                                                                                                                                      | `../context/NavigationContext`                                                                                                                                                                                                                            |
| `StorageManagement.tsx`           | Allows users to clear saved PR data from local storage.                                                                     | Retrieves storage data, and clears all keys and PR data.                                                                                                                                                                                                                                                                         | None                                                                                                                                                                                                                                                        |
| `Toast.tsx`                   | Displays a temporary toast message to provide feedback to the user.                                                              | Manages the visibility and duration of the toast message, displaying different icons and background colors based on the message type (success, error, info).  Uses a timeout to automatically close the toast.                                                                                                                      | None                                                                                                                                                                                                                                                        |

## Code Style and Examples

### Markdown Rendering

The `MarkdownRenderer` component utilizes the `react-markdown` library to render Markdown content.

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
};
```

### Checklist Item Toggling

The `FileChecklist` component handles toggling the state of checklist items:

```tsx
const toggleReviewState = (item: string) => {
    if (!checklistItems) return;

    const currentState = checklistItems[item];
    let nextState: 'PENDING' | 'OK' | 'NG';

    // PENDING -> NG -> OK -> NG cycle
    if (currentState === 'PENDING') {
      nextState = 'NG';
    } else if (currentState === 'NG') {
      nextState = 'OK';
    } else if (currentState === 'OK') {
      nextState = 'NG';
    } else {
      nextState = 'NG'; // fallback case, though it shouldn't happen
    }

    const newChecklistItems = {
      ...checklistItems,
      [item]: nextState,
    };

    // ローカル状態を更新
    setChecklistItems(newChecklistItems);

    // 明示的に親コンポーネントに通知（useEffectとは別に）
    onChecklistChange(file.filename, newChecklistItems);
  };
```

### Asynchronous Storage Operations

The `GeminiKeySettings`, `OpenAIKeySettings` and `GitHubIntegrationSettings` components demonstrates saving data to chrome storage.
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setIsLoading(true);
    await setKeyAndStorage(apiKey); // stores api key
    setApiKey('');
    onToast('API key saved', 'success');
  } finally {
    setIsLoading(false);
  }
};
```

## File Templates and Explanations

Each component file generally follows this structure:

1.  **Imports:** Import necessary React hooks, types, and other dependencies.
2.  **Props Interface:** Define the props interface for the component.
3.  **Component Definition:** Define the React component using a functional component with TypeScript.
4.  **Component Logic:** Implement the component's logic, including state management, event handlers, and side effects.
5.  **JSX Rendering:** Render the component's UI using JSX, leveraging Tailwind CSS for styling.
6. **Exports:** Export the component for use in other modules.

## Coding Rules Based on the Above

-   Adhere to the naming conventions outlined above.
-   Write well-documented code with clear and concise comments.
-   Use TypeScript for type safety and improved code maintainability.
-   Follow the design policy to ensure a consistent user experience.
-   Handle errors gracefully and provide informative feedback to the user.
-   Optimize components for performance and responsiveness.

## Notes for Developers

-   When modifying existing components, ensure that changes do not introduce regressions or break existing functionality.
-   When creating new components, consider their reusability and modularity.
-   Thoroughly test components to ensure they function correctly and meet the requirements.
-   Use descriptive commit messages to clearly communicate the purpose of each change.
-   Keep the UI consistent with the rest of the extension.
