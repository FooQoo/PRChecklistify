# pages/side-panel/src/hooks

## Overview

### Folder name
hooks

### Purpose of the folder
This folder contains custom React hooks used within the side panel component of the application. These hooks are responsible for managing state, interacting with storage, and fetching data related to Pull Requests (PRs) and AI service API keys. They encapsulate complex logic, making the components that use them cleaner and more maintainable.

## Naming Conventions

- Hooks should be named starting with `use` followed by a descriptive name of what the hook does, e.g., `usePRData`, `useGithubTokenAtom`.
- Atoms defined for use with Jotai should be named with the noun they represent followed by `Atom`, e.g. `githubTokenAtom`.
- Setter and remover functions for atom values should use `set[Noun]AndStorage` and `clear[Noun]`, respectively, to denote they also interact with persistent storage.

## Design Policy

- **Separation of Concerns:** Each hook should have a clear and focused responsibility.
- **Reusability:** Hooks should be designed to be reusable across different components within the side panel.
- **State Management:** Hooks that manage state should use Jotai atoms for global state and `useState` for component-specific state.
- **Asynchronous Operations:** Hooks that perform asynchronous operations should handle loading states and errors.
- **Storage Interaction:** Hooks dealing with persistent data should abstract the storage interaction logic.
- **Atom Pattern:** Use Jotai atoms and custom hooks to manage global states.
  - Define atom with `atom` from `jotai`.
  - Create hook prefixed with `use` to access the atom. The hook should also manage synchronization with `localStorage`.
- **Side Effects:** When loading data from persistent storage to Jotai atoms, handle the case when component unmounts to avoid memory leaks by using a `mounted` flag in the `useEffect`.

## Technologies and Libraries Used

- **React:** Used for building the UI and managing component lifecycle.
- **Jotai:** Used for state management.
- **`@extension/storage`:** Used to interact with browser extension storage for persistent data.
- **`@src/utils/*`:** Used for utility functions
- **`@src/atoms/*`:** Used for Jotai atoms that manage application-wide state.

## File Roles

| File Name           | Role                                                                                                | Logic and Functions                                                                                                                                                                                                                                   | Names of other files used (Dependencies)                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prDataLoader.ts`   | Loads and refreshes PR data from various sources (storage or API).                                   | - `loadPRDataFromAnySource`: Tries to load PR data from storage, if not found, fetches from API and saves to storage. Handles errors.<br>- `fetchAndSetPRData`: Fetches PR data from API, saves to storage, and updates state. Handles errors. | - `../types`: For type definitions of `PRData` and `PRAnalysisResult`.<br>- `../services/prDataService`: For fetching and saving PR data.<br>- `@src/utils/prUtils`: For extracting PR info. |
| `useGeminiKeyAtom.ts` | Manages the Gemini API key using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the Gemini API key stored in browser extension storage. Provides methods to set and clear the key.                                                                                                         | - `jotai`<br>- `react`<br>- `../services/gemini`                                                                                                                                           |
| `useGithubApiDomainAtom.ts` | Manages the Github API domain using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the Github API domain stored in browser extension storage. Provides methods to set and clear (reset to default) the domain.                                                                                                         | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useGithubTokenAtom.ts` | Manages the GitHub API token using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the GitHub API token stored in browser extension storage. Provides methods to set and clear the token.                                                                                                          | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useOpenaiDomainAtom.ts` | Manages the OpenAI API domain using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the OpenAI API domain stored in browser extension storage. Provides methods to set and clear (reset to default) the domain.                                                                                                          | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useOpenaiKeyAtom.ts`  | Manages the OpenAI API key using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the OpenAI API key stored in browser extension storage. Provides methods to set and clear the key.                                                                                                         | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `usePRData.ts`        | Manages PR data, loading, saving analysis results, and refreshing data.                            | - Loads PR data from storage or API.- Provides functions to save analysis summaries and checklists.- Provides functions to refresh and reload PR data.  -Calculates and monitors approval percentage.                                         | - `react`<br>- `jotai`<br>- `../types`<br>- `../services/prDataService`<br>- `@src/atoms/generatingAtom`<br>- `./prDataLoader`<br>- `../utils/prApprovalUtils`                            |

## Code Style and Examples

### Jotai Atom with Storage Synchronization

This pattern is used to manage global states that need to be persisted.

```typescript
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { someStorage } from '@extension/storage';

// Define the atom with a default value.
const someValueAtom = atom<string>('default');

export function useSomeValueAtom() {
  const [someValue, setSomeValue] = useAtom(someValueAtom);

  useEffect(() => {
    let mounted = true;
    someStorage.get().then(val => {
      if (mounted) setSomeValue(val);
    });
    return () => {
      mounted = false;
    };
  }, [setSomeValue]);

  const setValueAndStorage = async (newValue: string) => {
    await someStorage.set(newValue);
    setSomeValue(newValue);
  };

  const clearValue = async () => {
    await someStorage.clear();
    setSomeValue('default');
  };

  return { someValue, setValueAndStorage, clearValue } as const;
}
```

## File Templates and Explanations

### Custom Hook Template

```typescript
import { useState, useEffect } from 'react';

export function useMyCustomHook(initialValue: any) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Perform side effects here
  }, [state]);

  const updateState = (newValue: any) => {
    setState(newValue);
  };

  return {
    state,
    updateState,
  };
}
```

Explanation:

-   **`useMyCustomHook`:** Name your hook with the `use` prefix.
-   **`initialValue`:** Pass initial values as arguments to the hook.
-   **`useState`:** Use `useState` to manage component-specific state.
-   **`useEffect`:** Use `useEffect` for side effects, such as data fetching or subscriptions.
-   **`updateState`:** Expose functions to modify the state.
-   **Return:** Return an object containing the state and functions to interact with it.

## Coding Rules Based on the Above

1.  **Hook Naming:** Always start custom hook names with `use`.
2.  **Atom Naming:** Always name atoms with the noun they represent followed by `Atom`.
3.  **Single Responsibility:** Each hook should have a clear and focused responsibility.
4.  **Storage Interaction:** When interacting with storage, use the provided storage services (e.g., `@extension/storage`).
5.  **Error Handling:** Handle errors in asynchronous operations and provide appropriate feedback to the user.
6.  **Loading States:** Indicate loading states while performing asynchronous operations.
7.  **Jotai with Storage:** Use the Jotai atom pattern with storage synchronization for global persisted states.
8.  **Side Effect Handling:** When loading data from persistent storage to Jotai atoms, handle the case when component unmounts to avoid memory leaks by using a `mounted` flag in the `useEffect`.

## Notes for Developers

-   When creating new hooks, consider whether the logic can be reused across multiple components.
-   Ensure that hooks handle loading states and errors appropriately.
-   When managing API keys or tokens, use secure storage mechanisms and avoid exposing them directly in the UI.
-   Follow the naming conventions and coding style guidelines outlined in this document.
-   Be mindful of performance implications when fetching data or performing complex calculations within hooks.
-   When synchronizing Jotai atoms with `localStorage`, handle the case when component unmounts to avoid memory leaks by using a `mounted` flag in the `useEffect`.
