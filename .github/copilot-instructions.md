# Copilot Instructions

This file provides instructions for the copilot to assist with development in this project. It covers naming conventions, design policies, technologies used, coding rules, and important notes derived from the README files of various folders within the `pages/side-panel/src` directory.

## General

*   Use TypeScript for all new code.
*   Write well-documented code with clear and concise comments.
*   Handle errors gracefully and provide informative feedback to the user.
*   Optimize components for performance and responsiveness.
*   Use descriptive commit messages to clearly communicate the purpose of each change.
*   Keep the UI consistent with the rest of the extension.

## Naming Conventions

*   **Components:** PascalCase (e.g., `SidePanel`, `AppRoutes`, `FileChatModal`).
*   **Files:** PascalCase or camelCase depending on the primary export (e.g., `SidePanel.tsx`, `currentPageAtom.ts`, `aiService.ts`). Context files should end with `Context.tsx` (e.g., `NavigationContext.tsx`). Utility files should end with `Utils.ts` or similar convention.
*   **CSS Classes:** BEM-like structure (Block-Element-Modifier) where appropriate, using Tailwind CSS utility classes when possible.
*   **Atoms:** camelCase ending with "Atom" (e.g., `currentPageAtom`, `generatingAtom`, `githubTokenAtom`).
*   **Props Interfaces:** Named after the component, suffixed with `Props` (e.g., `FileChatModalProps`).
*   **Functions & Variables:** camelCase (e.g., `handleUrlChange`, `router`, `routes`, `navigateToPr`).
*   **Constants:** UPPER_SNAKE_CASE (e.g., `STORAGE_KEY`, `MAX_CACHE_SIZE`).
*   **Route paths:** Lowercase and use hyphens to separate words (e.g., `/github-token-setup`).
*   **Hooks:** Should be named starting with `use` (e.g., `usePRData`, `useGithubTokenAtom`).
*   **Setter/Remover Functions for Atoms:** Use `set[Noun]AndStorage` and `clear[Noun]`, respectively.

## Design Policy

*   **Component-Based:** The UI is structured into reusable React components.
*   **Functional Components:** Primarily uses functional components with hooks.
*   **Error Handling:** Components are wrapped with error boundaries for robust error handling (using `withErrorBoundary`).
*   **Suspense:** Loading states are managed using React Suspense (using `withSuspense`).
*   **Storage:** Utilize chrome storage API for maintaining state. API keys must be stored securely using the Chrome Storage API and should never be hardcoded.
*   **Single Responsibility Principle:** Each service/component should be responsible for a specific set of tasks.
*   **Clear Purpose:** The purpose of each atom should be immediately apparent from its name and usage.
*   **Atoms in context folder should adhere to:** Single Responsibility, Minimal Dependencies, Clear Purpose.
*   **The routing structure should be clear and intuitive for users.**
*   **UI should be clear, intuitive, and user-friendly.**

## Technologies and Libraries Used

*   **React:** JavaScript library for building user interfaces.
*   **TypeScript:** Superset of JavaScript that adds static typing.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **Jotai:** Primitive and flexible state management for React.
*   **React Router:** Standard library for routing in React applications (`react-router-dom`). Use `createMemoryRouter`.
*   **Chrome Storage API:** API provided by chrome to persist extension data (`@extension/storage`).
*   **Error Boundaries:** React feature for graceful error handling.
*   **React Suspense:** React feature for handling loading states.
*   **React Markdown:** A component for rendering Markdown content in React applications (`react-markdown`).
*   **remark-gfm:** Remark plugin to support GitHub Flavored Markdown.
*   **@octokit/rest:** For interacting with the GitHub API.
*   **openai:** For interacting with the OpenAI API.
*   **@google/genai:** For interacting with the Gemini API.
*   **@extension/i18n:** For internationalization (i18n) support.
*   **react-rewards:** For providing visual rewards, such as confetti, upon task completion.
*   **swr:** A library for React Hooks for Data Fetching (used in `aiService.ts`).

## Coding Rules

*   Use TypeScript for all new code.
*   Follow the naming conventions outlined above.
*   Implement proper error handling using `withErrorBoundary` and try...catch blocks. Log errors and re-throw or return appropriate error messages.
*   Manage loading states with `withSuspense` or useState.
*   Utilize Jotai for state management, especially for global states.
*   Write modular and reusable components.
*   Use Tailwind CSS utility classes for styling where applicable.
*   Document all components and functions with clear and concise comments.
*   When fetching data from `chrome.storage`, always handle potential errors with `try...catch` blocks.
*   Clean up event listeners (e.g., `chrome.storage.onChanged`) in `useEffect` cleanup functions to prevent memory leaks. Use a `mounted` flag.
*   Keep atoms focused: Each atom should manage a single, well-defined piece of state.
*   Define types: Always define the type of data an atom holds. This helps prevent errors.
*   Minimize dependencies: Atoms should be as independent as possible.
*   Use `useAtom` hook to read and write atom values.
*   Always use the `useNavigation` hook to access the navigation context within functional components.
*   Ensure that components that use the `useNavigation` hook are wrapped within the `NavigationProvider`.
*   Centralize navigation logic within the `NavigationContext` to maintain consistency.
*   When adding new navigation functions, update the `NavigationContextType` interface and the `contextValue` object.
*   Keep the context logic focused on state management and navigation, avoiding complex business logic.
*   Handle side effects carefully within the context, using `useEffect` appropriately.
*   When extracting information from URLs, use a dedicated function like `extractPRInfo` to encapsulate the logic.
*   Avoid redundant navigations (e.g., navigating to the same page twice in a row).
*   When using `useEffect` for token checks, use a `firstMount` atom to ensure the navigation to token setup only happens on initial load.
*   Each hook should have a clear and focused responsibility.
*   When interacting with storage, use the provided storage services (e.g., `@extension/storage`).
*   Handle errors in asynchronous operations and provide appropriate feedback to the user.
*   Indicate loading states while performing asynchronous operations.
*   Use the Jotai atom pattern with storage synchronization for global persisted states.
*   Avoid modifying input data directly. Create copies when necessary to maintain data integrity.
*   Validate data received from external APIs to ensure it conforms to the expected schema.
*   Use `async/await` for asynchronous operations to improve code readability.
*   For classes like `GithubClient`, use the singleton pattern.
*   Use backticks for string literals that contain template literals.
*   Ensure that all type definitions are exported from `index.ts`.

## Important Notes

*   When modifying or creating new components, ensure they are thoroughly tested.
*   Pay attention to performance considerations, especially when dealing with large datasets or complex calculations.
*   Keep the codebase clean and well-organized.
*   Always handle errors and loading states gracefully.
*   Use Chrome Storage API with caution, as storage is limited.
*   Consider the user experience when designing new features or making changes to existing ones.
*   Remember to import atoms from their respective files when using them in components.
*   Consider using derived atoms for complex state transformations. This can help keep your code organized and maintainable.
*   When updating an atom's value, always use the `setCurrentPage` function returned by the `useAtom` hook.
*   When modifying existing components, ensure that changes do not introduce regressions or break existing functionality.
*   When creating new components, consider their reusability and modularity.
*   Thoroughly test components to ensure they function correctly and meet the requirements.
*   Be mindful of the dependencies between files and update the import statements accordingly.
*   Document any new navigation functions or context variables clearly.
*   Consider adding unit tests to verify the behavior of the navigation functions and context provider.
*   If performance becomes an issue, investigate ways to optimize the context usage and reduce unnecessary re-renders.
*   When adding new atoms, ensure that they are properly documented and used consistently throughout the application.
*   Ensure that token checks only occur once during the application's initial load to avoid unnecessary redirects.
*   When creating new hooks, consider whether the logic can be reused across multiple components.
*   Ensure that hooks handle loading states and errors appropriately.
*   When managing API keys or tokens, use secure storage mechanisms and avoid exposing them directly in the UI.
*   Be mindful of performance implications when fetching data or performing complex calculations within hooks.
*   Be consistent with the existing coding style and conventions.
*   Regularly review the type definitions to ensure they are still accurate and up-to-date. Ensure to add detailed comments to each interface and property to enhance understanding and future maintenance. Pay special attention to new properties and complex data structures.
*   Prioritize code readability and maintainability.


---

# All README files
# README.md

# Side Panel - `pages/side-panel/src`

## Overview

The `src` folder within `pages/side-panel` contains the source code for the side panel extension, which is a React application designed to be embedded within a browser extension. It handles the rendering and logic of the side panel UI, including routing, state management, and interactions with browser storage.

- **Folder Name:** `src`
- **Purpose:** To house all React components, styles, and business logic required for the side panel application.

## Naming Conventions

- **Components:** PascalCase (e.g., `SidePanel`, `AppRoutes`).
- **Files:** PascalCase or camelCase depending on the primary export (e.g., `SidePanel.tsx`, `currentPageAtom.ts`).
- **CSS Classes:** BEM-like structure (Block-Element-Modifier) where appropriate, using Tailwind CSS utility classes when possible.
- **Atoms:** camelCase ending with "Atom" (e.g., `currentPageAtom`).

## Design Policy

-   **Component-Based:** The UI is structured into reusable React components.
-   **Functional Components:** Primarily uses functional components with hooks.
-   **Error Handling:** Components are wrapped with error boundaries for robust error handling.
-   **Suspense:** Loading states are managed using React Suspense.
-   **Storage:** Utilize chrome storage API for maintaining state

## Technologies and Libraries Used

-   **React:** JavaScript library for building user interfaces.
-   **TypeScript:** Superset of JavaScript that adds static typing.
-   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
-   **Jotai:** Primitive and flexible state management for React.
-   **React Router:** Standard library for routing in React applications.
-   **Chrome Storage API**: API provided by chrome to persist extension data
-   **Error Boundaries:** React feature for graceful error handling.
-   **React Suspense:** React feature for handling loading states.

## File Roles

| File Name        | Role                                                                      | Logic and Functions                                                                                                                                                                                                                                                                                                                                                                | Names of other files used         |
| ---------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `SidePanel.css`   | Contains styling for the main `SidePanel` component.                       | Defines CSS classes for the overall layout, header, and logo of the application.  Includes styles for handling overflow using `overflow-y: auto`.                                                                                                                                                                                                                               | None                              |
| `SidePanel.tsx`   | The main component that renders the entire side panel application.        | Initializes the application, fetches the current page URL from Chrome storage using `chrome.storage.local.get('currentPage')`, sets up a listener for storage changes with `chrome.storage.onChanged.addListener`, and renders the `AppRouter`. Uses `withErrorBoundary` and `withSuspense` for robust error handling and loading state management. Uses `currentPageAtom` to manage the current page's URL.  It also manages a loading state using `useState` to display a loading indicator. | `AppRouter`, `currentPageAtom`, `@extension/shared`   |
| `index.css`       | Global CSS file, mainly used for Tailwind CSS configuration and base styles. | Imports Tailwind CSS layers (base, components, utilities) using `@tailwind`. Defines custom CSS classes for markdown styling and animations, including `fadeInUp` and `pulse` effects.                                                                                                                                                                                           | None                              |
| `index.tsx`       | Entry point for rendering the React application into the DOM.             | Contains the `init` function which finds the `#app-container` element in the DOM using `document.querySelector` and renders the `SidePanel` component using `createRoot`. Throws an error if the container is not found.                                                                                                                                                   | `SidePanel`                      |

## Code Style and Examples

### Error Handling

```typescript
import { withErrorBoundary } from '@extension/shared';

const MyComponent = () => {
  // ... component logic ...
};

export default withErrorBoundary(MyComponent, <div>Error!</div>);
```

This example demonstrates the use of `withErrorBoundary` HOC to wrap a component and provide a fallback UI in case of errors.

### Suspense

```typescript
import { withSuspense } from '@extension/shared';

const MyComponent = () => {
  // ... component logic ...
};

export default withSuspense(MyComponent, <div>Loading...</div>);
```

This example shows the use of `withSuspense` HOC to handle loading states, displaying a loading indicator while the component is being fetched/rendered.

### State Management

```typescript
import { useAtom } from 'jotai';
import { currentPageAtom } from './atoms/currentPageAtom';

const MyComponent = () => {
  const [currentPage, setCurrentPage] = useAtom(currentPageAtom);

  // ... component logic using currentPage ...

  return (
    <div>
      Current Page URL: {currentPage.url}
    </div>
  );
};
```

This example illustrates the usage of Jotai's `useAtom` hook to access and update the `currentPageAtom` state.

## File Templates and Explanations

### React Component Template (Functional Component)

```typescript
import React from 'react';

interface Props {
  // Define component props here
}

const MyComponent: React.FC<Props> = ({ /* props */ }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### Atom Template

```typescript
import { atom } from 'jotai';

interface AtomType {
  url: string;
}

export const myAtom = atom<AtomType>({url:''});
```

## Coding Rules Based on the Above

-   Use TypeScript for all new code.
-   Follow the naming conventions outlined above.
-   Implement proper error handling using `withErrorBoundary`.
-   Manage loading states with `withSuspense`.
-   Utilize Jotai for state management.
-   Write modular and reusable components.
-   Use Tailwind CSS utility classes for styling where applicable.
-   Document all components and functions with clear and concise comments.
-   When fetching data from `chrome.storage`, always handle potential errors with `try...catch` blocks.
-   Clean up event listeners (e.g., `chrome.storage.onChanged`) in `useEffect` cleanup functions to prevent memory leaks.

## Notes for Developers

-   When modifying or creating new components, ensure they are thoroughly tested.
-   Pay attention to performance considerations, especially when dealing with large datasets or complex calculations.
-   Keep the codebase clean and well-organized.
-   Always handle errors and loading states gracefully.
-   Use Chrome Storage API with caution, as storage is limited.
-   Consider the user experience when designing new features or making changes to existing ones.

---
# atoms/README.md

# Atoms

## Overview

**Folder Name:** atoms

**Purpose:** This folder contains Jotai atoms that manage application state related to the side panel. Atoms provide a simple and flexible way to store and update state globally, enabling efficient data sharing and reactivity between different components within the side panel.

## Naming Conventions

*   Atom names should be descriptive and clearly indicate the state they manage.
*   Atom names should end with "Atom" (e.g., `currentPageAtom`, `generatingAtom`).
*   Interface names for atom's value should be named like `CurrentPage`

## Design Policy

Atoms in this folder should adhere to the following principles:

*   **Single Responsibility:** Each atom should manage a specific piece of state.
*   **Minimal Dependencies:** Atoms should ideally be independent and have minimal dependencies on other parts of the application.
*   **Clear Purpose:** The purpose of each atom should be immediately apparent from its name and usage.

## Technologies and Libraries Used

*   **Jotai:** A primitive and flexible state management library for React. It's used for creating and managing the atoms in this folder.

## File Roles

| File Name         | Role                                                     | Logic and Functions                                                                                                  | Names of other files used |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| currentPageAtom.ts | Stores the URL of the current page being displayed in the side panel. | `currentPageAtom`: A Jotai atom that holds an object of type `CurrentPage | null`. `CurrentPage` interface defines the `url` property. | None                    |
| generatingAtom.ts | Indicates whether the content is currently being generated.             | `generatingAtom`: A Jotai atom that holds a boolean value.  `true` indicates that content generation is in progress. | None                    |

## Code Style and Examples

### Jotai Atom Creation

Atoms are created using the `atom` function from the `jotai` library. You can define an initial value for the atom.

```typescript
import { atom } from 'jotai';

export const generatingAtom = atom(false);
```

### Atom Value Types

Atom values can be primitives (boolean, string, number), objects, or even null.  It's important to explicitly define the type of the atom's value for type safety.

```typescript
import { atom } from 'jotai';

export interface CurrentPage {
  url: string;
  // Other properties as needed
}

export const currentPageAtom = atom<CurrentPage | null>(null);
```

### Reading and Writing Atom Values

To read and write atom values, you will use `useAtom` hook from `jotai`.

```typescript
import { useAtom } from 'jotai';
import { currentPageAtom } from './atoms/currentPageAtom';

function MyComponent() {
  const [currentPage, setCurrentPage] = useAtom(currentPageAtom);

  const handlePageChange = (newUrl: string) => {
    setCurrentPage({ url: newUrl });
  };

  return (
    <div>
      {currentPage ? <p>Current URL: {currentPage.url}</p> : <p>No URL</p>}
      <button onClick={() => handlePageChange("https://example.com")}>Go to Example</button>
    </div>
  );
}

```

## File Templates and Explanations

### Basic Atom Template

```typescript
import { atom } from 'jotai';

// Define an interface for the atom's value (optional, but recommended for complex values)
export interface MyAtomValue {
  property1: string;
  property2: number;
}

// Create the atom with an initial value
export const myAtom = atom<MyAtomValue | null>(null);
```

*   **Import `atom`:** Import the `atom` function from the `jotai` library.
*   **Define an Interface (Optional):** If the atom holds a complex value (an object), define an interface to specify the shape of the data. This provides type safety.
*   **Create the Atom:** Use the `atom()` function to create the atom.  Provide an initial value for the atom.  If the atom can be null, specify it in the generic type (`<MyAtomValue | null>`).

## Coding Rules

*   **Keep atoms focused:** Each atom should manage a single, well-defined piece of state.
*   **Use clear naming:**  Atom names should clearly describe the state they manage.
*   **Define types:** Always define the type of data an atom holds. This helps prevent errors.
*   **Minimize dependencies:** Atoms should be as independent as possible.
*   **Use `useAtom` hook to read and write atom values.**
*   **Use explicit types** Always define explicit types for atom values to ensure type safety and prevent unexpected behavior.

## Notes for Developers

*   Remember to import atoms from their respective files when using them in components.
*   Consider using derived atoms for complex state transformations. This can help keep your code organized and maintainable.
*   When updating an atom's value, always use the `setCurrentPage` function returned by the `useAtom` hook.

---
# components/README.md

# `pages/side-panel/src/components`

## Overview

The `components` folder houses the React components that constitute the core UI elements of the side panel in the PR Checklistify extension. These components handle various aspects of the extension, from displaying PR analysis results and file checklists to managing settings and displaying informative messages. It now also includes support for Gemini models, alongside OpenAI.

- **Folder Name:** components
- **Purpose:** Contains reusable React components for the PR Checklistify extension's side panel.

## Naming Conventions

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

---
# context/README.md

# pages/side-panel/src/context

## Overview

This folder, named `context`, is responsible for managing the global state and navigation logic of the side panel application. It provides a centralized way to access and modify application state, as well as navigate between different views. It utilizes React Context and Jotai for efficient state management.

- **Folder Name:** `context`
- **Purpose:** Manages global state and navigation logic for the side panel application.

## Naming Conventions

-   Files related to context management should end with `Context.tsx` (e.g., `NavigationContext.tsx`).
-   Context variables and functions should use camelCase (e.g., `navigateToPr`).
-   Interface names should use PascalCase (e.g., `NavigationContextType`).
-   Atoms names should end with `Atom` (e.g., `currentPageAtom`).
-   Hook names should start with `use` and end with `Atom` (e.g., `useGithubTokenAtom`)

## Design Policy

-   The context should provide a clean and consistent API for accessing and modifying application state.
-   Navigation logic should be centralized within the context to ensure consistency and maintainability.
-   Context providers should wrap the parts of the application that need access to the context.
-   Custom hooks should be used to simplify access to context values.
-   Avoid storing large amounts of data in the context to prevent performance issues.  Use Jotai atoms for larger or more frequently updated state.
-   Keep context logic lean and focused on state management and navigation.
-   Side effects within the context should be handled carefully to avoid unexpected behavior.

## Technologies and Libraries Used

-   **React:**  For building the UI and using context API.
-   **`createContext` and `useContext` (from React):** For creating and consuming the navigation context.
-   **`useEffect` (from React):** For performing side effects, such as navigating based on state changes and managing token checks.
-   **`jotai`:** For managing global state using atoms.
-   **`@src/atoms/generatingAtom`:** For tracking the generating status, preventing navigation during generation.
-   **`@src/atoms/currentPageAtom`:** For tracking the current page URL and triggering navigation when it changes.
-   **`@src/hooks/useGithubTokenAtom`:** Custom hook for accessing and managing the GitHub token.
-   **`@src/hooks/useOpenaiKeyAtom`:** Custom hook for accessing and managing the OpenAI API key.
-   **`@src/hooks/useGeminiKeyAtom`:** Custom hook for accessing and managing the Gemini API key.
-   **`@src/routes/AppRoutes`:** For handling navigation within the application, specifically using the `router.navigate` function.

## File Roles

| File Name           | Role                                                            | Logic and Functions                                                                                                                                                           | Names of other files used (Dependencies)                           |
| ------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `NavigationContext.tsx` | Provides the navigation context for the application.           | - `navigateToPr`: Navigates to a PR page based on a URL.\
|                           |                                                                 | - `navigateToPrFromHistory`: Navigates to a PR page from history (owner, repo, PR number).\
|                           |                                                                 | - `navigateToSettings`: Navigates to the settings page.\
|                           |                                                                 | - `navigateToHome`: Navigates to the home page.\
|                           |                                                                 | - `navigateToGithubTokenSetup`: Navigates to the GitHub token setup page.\
|                           |                                                                 | - `navigateToOpenAiTokenSetup`: Navigates to the OpenAI token setup page.\
|                           |                                                                 | - `extractPRInfo`: Extracts the owner, repository, and PR number from a PR URL. \
|                           |                                                                 | - `useEffect`: Monitors changes to `currentPage` and navigates to the PR page if necessary. It avoids navigation if `generating` is true.\
|                           |                                                                 | - `useEffect`: Monitors token status and navigates to token setup pages on the first mount if tokens are missing. Prevents redundant navigations.                                                                                               | `AppRoutes.ts`, `generatingAtom`, `currentPageAtom`, `useGithubTokenAtom`, `useOpenaiKeyAtom`, `useGeminiKeyAtom` |

## Code Style and Examples

### Navigation

The `NavigationContext` provides functions for navigating to different parts of the application.  It uses the `router.navigate` function from `@src/routes/AppRoutes` to perform the navigation.

```typescript
const navigateToPr = (url: string) => {
  const prInfo = extractPRInfo(url);
  if (!prInfo) return;
  const { owner, repo, prNumber } = prInfo;
  router.navigate(`/pr/${owner}/${repo}/${prNumber}`);
};
```

### Context Usage

The `useNavigation` hook simplifies the usage of the `NavigationContext`. It ensures that the context is used within a `NavigationProvider`.

```typescript
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
```

### URL Extraction

The `extractPRInfo` function extracts the owner, repository, and PR number from a PR URL. This function is used to parse URLs and extract the necessary information for navigation.

```typescript
const extractPRInfo = (url: string): { owner: string; repo: string; prNumber: string } | null => {
  // githun.comに限らずドメインは考慮しない
  const baseMatch = url.match(/(?:https?:\/\/)?[^/]+\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!baseMatch) return null;

  const [, owner, repo, prNumber] = baseMatch;
  return { owner, repo, prNumber };
};
```

## File Templates and Explanations

**NavigationContext.tsx:**

```typescript
import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { router } from '../routes/AppRoutes';
import { atom, useAtom } from 'jotai';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { currentPageAtom } from '@src/atoms/currentPageAtom';
import { useGithubTokenAtom } from '@src/hooks/useGithubTokenAtom';
import { useOpenaiKeyAtom } from '@src/hooks/useOpenaiKeyAtom';
import { useGeminiKeyAtom } from '@src/hooks/useGeminiKeyAtom';

// 現在のviewを管理するatom
const firstMountAtom = atom(true);

// ナビゲーション状態の型
interface NavigationContextType {
  navigateToPr: (url: string) => void;
  navigateToPrFromHistory: (owner: string, repo: string, prNumber: string) => void;
  navigateToSettings: () => void;
  navigateToHome: () => void;
  navigateToGithubTokenSetup: () => void;
  navigateToOpenAiTokenSetup: () => void;
}

// ナビゲーションコンテキストの作成
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
interface NavigationProviderProps {
  children: ReactNode;
}

// PRのURLからオーナー、リポジトリ、PR番号を抽出する関数
const extractPRInfo = (url: string): { owner: string; repo: string; prNumber: string } | null => {
  // githun.comに限らずドメインは考慮しない
  const baseMatch = url.match(/(?:https?:\/\/)?[^/]+\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!baseMatch) return null;

  const [, owner, repo, prNumber] = baseMatch;
  return { owner, repo, prNumber };
};

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [generating] = useAtom(generatingAtom);
  const [currentPage] = useAtom(currentPageAtom);
  const { githubToken, isGithubTokenLoaded } = useGithubTokenAtom();
  const { openaiKey, isOpenaiKeyLoaded } = useOpenaiKeyAtom();
  const { geminiKey, isGeminiKeyLoaded } = useGeminiKeyAtom();
  const [firstMount, setFirstMount] = useAtom(firstMountAtom);

  // currentPageの変更を監視してPRページに遷移する
  useEffect(() => {
    if (generating) return;

    if (currentPage?.url) {
      const prInfo = extractPRInfo(currentPage.url);
      if (prInfo) {
        router.navigate(`/pr/${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`);
      }
    }
  }, [generating, currentPage]);

  // トークン
  useEffect(() => {
    if (firstMount && isGithubTokenLoaded && !githubToken) {
      setFirstMount(false);
      router.navigate('/github-token-setup');
      return;
    }

    if (firstMount && isOpenaiKeyLoaded && isGeminiKeyLoaded && !openaiKey && !geminiKey) {
      setFirstMount(false);
      router.navigate('/openai-token-setup');
      return;
    }
  }, [
    isGithubTokenLoaded,
    githubToken,
    firstMount,
    setFirstMount,
    isOpenaiKeyLoaded,
    openaiKey,
    isGeminiKeyLoaded,
    geminiKey,
  ]);

  // ナビゲーション関数
  const navigateToPr = (url: string) => {
    const prInfo = extractPRInfo(url);
    if (!prInfo) return;
    const { owner, repo, prNumber } = prInfo;
    router.navigate(`/pr/${owner}/${repo}/${prNumber}`);
  };

  const navigateToPrFromHistory = (owner: string, repo: string, prNumber: string) => {
    router.navigate(`/pr/${owner}/${repo}/${prNumber}`);
  };

  const navigateToSettings = () => {
    router.navigate('/settings');
  };

  const navigateToHome = () => {
    router.navigate('/');
  };

  // --- 追加: トークンセットアップ画面へのナビゲーション ---
  const navigateToGithubTokenSetup = () => {
    router.navigate('/github-token-setup');
  };

  const navigateToOpenAiTokenSetup = () => {
    router.navigate('/openai-token-setup');
  };

  // コンテキスト値の提供
  const contextValue: NavigationContextType = {
    navigateToPr,
    navigateToPrFromHistory,
    navigateToSettings,
    navigateToHome,
    navigateToGithubTokenSetup,
    navigateToOpenAiTokenSetup,
  };

  return <NavigationContext.Provider value={contextValue}>{children}</NavigationContext.Provider>;
};

// カスタムフック - コンテキストの使用を簡素化
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
```

This file creates and exports a React Context named `NavigationContext`.  It provides functions to navigate the application to different routes.  It also handles initial navigation to token setup pages if tokens are missing on the first mount. It avoids redundant navigations to the same pages.

## Coding Rules Based on the Above

-   Always use the `useNavigation` hook to access the navigation context within functional components.
-   Ensure that components that use the `useNavigation` hook are wrapped within the `NavigationProvider`.
-   Centralize navigation logic within the `NavigationContext` to maintain consistency.
-   When adding new navigation functions, update the `NavigationContextType` interface and the `contextValue` object.
-   Follow the naming conventions outlined above.
-   Keep the context logic focused on state management and navigation, avoiding complex business logic.
-   Handle side effects carefully within the context, using `useEffect` appropriately.
-   When extracting information from URLs, use a dedicated function like `extractPRInfo` to encapsulate the logic.
-   Avoid redundant navigations (e.g., navigating to the same page twice in a row).
-   When using `useEffect` for token checks, use a `firstMount` atom to ensure the navigation to token setup only happens on initial load.

## Notes for Developers

-   When modifying the navigation logic, thoroughly test the changes to ensure that all navigation paths are working correctly.
-   Be mindful of the dependencies between files and update the import statements accordingly.
-   Document any new navigation functions or context variables clearly.
-   Consider adding unit tests to verify the behavior of the navigation functions and context provider.
-   If performance becomes an issue, investigate ways to optimize the context usage and reduce unnecessary re-renders.
-   When adding new atoms, ensure that they are properly documented and used consistently throughout the application.
-   Ensure that token checks only occur once during the application's initial load to avoid unnecessary redirects.

---
# hooks/README.md

# pages/side-panel/src/hooks

## Overview

### Folder name
hooks

### Purpose of the folder
This folder contains custom React hooks used within the side panel component of the application. These hooks are responsible for managing state, interacting with storage, and fetching data related to Pull Requests (PRs) and AI service API keys, model client type and domains. They encapsulate complex logic, making the components that use them cleaner and more maintainable.

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
- **`../services/*`:** Used for interaction with backend and services.

## File Roles

| File Name                      | Role                                                                                                | Logic and Functions                                                                                                                                                                                                                                   | Names of other files used (Dependencies)                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prDataLoader.ts`              | Loads and refreshes PR data from various sources (storage or API).                                   | - `loadPRDataFromAnySource`: Tries to load PR data from storage, if not found, fetches from API and saves to storage. Handles errors.<br>- `fetchAndSetPRData`: Fetches PR data from API, saves to storage, and updates state. Handles errors. | - `../types`: For type definitions of `PRData` and `PRAnalysisResult`.<br>- `../services/prDataService`: For fetching and saving PR data.<br>- `@src/utils/prUtils`: For extracting PR info. |
| `useGeminiKeyAtom.ts`           | Manages the Gemini API key using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the Gemini API key stored in browser extension storage. Provides methods to set and clear the key.                                                                                                         | - `jotai`<br>- `react`<br>- `../services/gemini`                                                                                                                                           |
| `useGithubApiDomainAtom.ts`     | Manages the Github API domain using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the Github API domain stored in browser extension storage. Provides methods to set and clear (reset to default) the domain.                                                                                                         | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useGithubTokenAtom.ts`         | Manages the GitHub API token using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the GitHub API token stored in browser extension storage. Provides methods to set and clear the token.                                                                                                          | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useModelClientTypeAtom.ts`     | Manages the model client type (OpenAI or Gemini) using Jotai and browser extension storage.         | - Synchronizes a Jotai atom with the model client type stored in browser extension storage. Provides methods to set and clear the type.                                                                                                            | - `jotai`<br>- `react`<br>- `../services/modelClient`                                                                                                                                           |
| `useOpenaiDomainAtom.ts`       | Manages the OpenAI API domain using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the OpenAI API domain stored in browser extension storage. Provides methods to set and clear (reset to default) the domain.                                                                                                          | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `useOpenaiKeyAtom.ts`          | Manages the OpenAI API key using Jotai and browser extension storage.                             | - Synchronizes a Jotai atom with the OpenAI API key stored in browser extension storage. Provides methods to set and clear the key.                                                                                                         | - `jotai`<br>- `react`<br>- `@extension/storage`                                                                                                                                           |
| `usePRData.ts`             | Manages PR data, loading, saving analysis results, and refreshing data.                            | - Loads PR data from storage or API.- Provides functions to save analysis summaries and checklists.- Provides functions to refresh and reload PR data.  -Calculates and monitors approval percentage.                                         | - `react`<br>- `jotai`<br>- `../types`<br>- `../services/prDataService`<br>- `@src/atoms/generatingAtom`<br>- `./prDataLoader`<br>- `../utils/prApprovalUtils`                            |

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

## prDataLoader.ts
```
import type { PRData, PRAnalysisResult } from '../types';
import { fetchPRData, prDataStorage } from '../services/prDataService';
import { extractPRInfoFromKey } from '@src/utils/prUtils';

export const loadPRDataFromAnySource = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setAnalysisResult: (result: PRAnalysisResult | undefined) => void,
  setError: (err: string | null) => void,
) => {
  const identifier = extractPRInfoFromKey(prKey);
  if (!identifier) {
    return;
  }
  try {
    const savedData = await prDataStorage.getFromStorage(prKey);
    if (savedData) {
      setPRData(savedData.data);
      if (savedData.analysisResult) {
        setAnalysisResult(savedData.analysisResult);
      } else {
        setAnalysisResult(undefined);
      }
    } else {
      const newData = await fetchPRData(identifier);
      if (newData) {
        setPRData(newData);
        await prDataStorage.saveToStorage(prKey, newData);
        setAnalysisResult(undefined);
      } else {
        setError('Failed to load PR data');
      }
    }
  } catch {
    console.error('Error in loadPRData');
    setError('An error occurred while loading PR data');
  }
};

export const fetchAndSetPRData = async (
  prKey: string,
  setPRData: (data: PRData | null) => void,
  setError: (err: string | null) => void,
  setIsLoading: (b: boolean) => void,
  analysisResult: PRAnalysisResult | undefined,
) => {
  const identifier = extractPRInfoFromKey(prKey);
  if (!identifier) return;
  setIsLoading(true);
  setError(null);
  try {
    const newData = await fetchPRData(identifier);
    if (newData) {
      setPRData(newData);
      await prDataStorage.saveToStorage(prKey, newData, analysisResult || undefined);
    } else {
      setError('Failed to refresh PR data');
    }
  } catch {
    setError('An error occurred while refreshing PR data');
  } finally {
    setIsLoading(false);
  }
};

```

## useGeminiKeyAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { geminiApiKeyStorage } from '../services/gemini';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const geminiKeyAtom = atom<string | undefined>(undefined);
const isGeminiKeyLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGeminiKeyAtom() {
  const [geminiKey, setGeminiKey] = useAtom(geminiKeyAtom);
  const [isGeminiKeyLoaded, setIsGeminiKeyLoaded] = useAtom(isGeminiKeyLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    geminiApiKeyStorage.get().then(val => {
      if (mounted) setGeminiKey(val || undefined);
      setIsGeminiKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGeminiKey, setIsGeminiKeyLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setKeyAndStorage = async (newKey: string) => {
    await geminiApiKeyStorage.set(newKey);
    setGeminiKey(newKey);
  };

  // remover: キーをクリア
  const clearKey = async () => {
    await geminiApiKeyStorage.clear();
    setGeminiKey(undefined);
  };

  return { geminiKey, setKeyAndStorage, clearKey, isGeminiKeyLoaded } as const;
}

```

## useGithubApiDomainAtom.ts
```
import { atom, useAtom } from 'jotai';
import { githubApiDomainStorage } from '@extension/storage';
import { useEffect } from 'react';

// jotai atom: 初期値はnull、ロード時にstorageから取得
const githubApiDomainAtom = atom<string>('https://api.github.com');

// storageの値をjotai atomに同期するカスタムフック
export function useGithubApiDomainAtom() {
  const [githubDomain, setGithubDomain] = useAtom(githubApiDomainAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    githubApiDomainStorage.get().then(val => {
      if (mounted) setGithubDomain(val);
    });
    return () => {
      mounted = false;
    };
  }, [setGithubDomain]);

  // setter: jotai atomとstorage両方を更新
  const setDomainAndStorage = async (newDomain: string) => {
    await githubApiDomainStorage.set(newDomain);
    setGithubDomain(newDomain);
  };

  // remover: デフォルト値にリセット
  const clearDomain = async () => {
    await githubApiDomainStorage.clear();
    setGithubDomain('https://api.github.com');
  };

  return { githubDomain, setDomainAndStorage, clearDomain } as const;
}

```

## useGithubTokenAtom.ts
```
import { atom, useAtom } from 'jotai';
import { githubTokenStorage } from '@extension/storage';
import { useEffect } from 'react';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const githubTokenAtom = atom<string | undefined>(undefined);
const isGithubTokenLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useGithubTokenAtom() {
  const [githubToken, setGithubToken] = useAtom(githubTokenAtom);
  const [isGithubTokenLoaded, setIsGithubTokenLoaded] = useAtom(isGithubTokenLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    githubTokenStorage.get().then(val => {
      if (mounted) setGithubToken(val);
      setIsGithubTokenLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setGithubToken, setIsGithubTokenLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setTokenAndStorage = async (newToken: string) => {
    await githubTokenStorage.set(newToken);
    setGithubToken(newToken);
  };

  // remover: トークンをクリア
  const clearToken = async () => {
    await githubTokenStorage.clear();
    setGithubToken(undefined);
  };

  return { githubToken, setTokenAndStorage, clearToken, isGithubTokenLoaded } as const;
}

```

## useModelClientTypeAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { ModelClientType, modelClientTypeStorage } from '../services/modelClient';

// 型定義
export type ModelClientTypeAtomType = ModelClientType;

export const modelClientTypeAtom = atom<ModelClientType>(ModelClientType.OpenAI);

/**
 * モデルクライアント種別（OpenAI/Gemini）を管理するカスタムフック
 * - グローバル状態とストレージを同期
 */
export function useModelClientTypeAtom() {
  const [modelClientType, setModelClientType] = useAtom(modelClientTypeAtom);

  // 初期化時にストレージから取得
  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await modelClientTypeStorage.get();
      if (mounted && saved) setModelClientType(saved);
    })();
    return () => {
      mounted = false;
    };
  }, [setModelClientType]);

  // setter
  const setTypeAndStorage = async (type: ModelClientType) => {
    await modelClientTypeStorage.set(type);
    setModelClientType(type);
  };

  // remover
  const clearType = async () => {
    await modelClientTypeStorage.clear();
    setModelClientType(ModelClientType.OpenAI);
  };

  return { modelClientType, setTypeAndStorage, clearType } as const;
}

```

## useOpenaiDomainAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiApiEndpointStorage } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const openaiDomainAtom = atom<string>('https://api.openai.com/v1');
const isOpenaiDomainLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useOpenaiDomainAtom() {
  const [openaiDomain, setOpenaiDomain] = useAtom(openaiDomainAtom);
  const [isOpenaiDomainLoaded, setIsOpenaiDomainLoaded] = useAtom(isOpenaiDomainLoadedAtom);

  useEffect(() => {
    let mounted = true;
    openaiApiEndpointStorage.get().then(val => {
      if (mounted) setOpenaiDomain(val);
      setIsOpenaiDomainLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiDomain, setIsOpenaiDomainLoaded]);

  const setDomainAndStorage = async (newDomain: string) => {
    await openaiApiEndpointStorage.set(newDomain);
    setOpenaiDomain(newDomain);
  };

  const clearDomain = async () => {
    await openaiApiEndpointStorage.clear();
    setOpenaiDomain('https://api.openai.com');
  };

  return { openaiDomain, setDomainAndStorage, clearDomain, isOpenaiDomainLoaded } as const;
}

```

## useOpenaiKeyAtom.ts
```
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { openaiApiKeyStorage } from '@extension/storage';

// jotai atom: 初期値はundefined、ロード時にstorageから取得
export const openaiKeyAtom = atom<string | undefined>(undefined);
const isOpenaiKeyLoadedAtom = atom<boolean>(false);

// storageの値をjotai atomに同期するカスタムフック
export function useOpenaiKeyAtom() {
  const [openaiKey, setOpenaiKey] = useAtom(openaiKeyAtom);
  const [isOpenaiKeyLoaded, setIsOpenaiKeyLoaded] = useAtom(isOpenaiKeyLoadedAtom);

  // 初回マウント時にstorageから値を取得
  useEffect(() => {
    let mounted = true;
    openaiApiKeyStorage.get().then(val => {
      if (mounted) setOpenaiKey(val || undefined);
      setIsOpenaiKeyLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setOpenaiKey, setIsOpenaiKeyLoaded]);

  // setter: jotai atomとstorage両方を更新
  const setKeyAndStorage = async (newKey: string) => {
    await openaiApiKeyStorage.set(newKey);
    setOpenaiKey(newKey);
  };

  // remover: キーをクリア
  const clearKey = async () => {
    await openaiApiKeyStorage.clear();
    setOpenaiKey(undefined);
  };

  return { openaiKey, setKeyAndStorage, clearKey, isOpenaiKeyLoaded } as const;
}

```

## usePRData.ts
```
import { useState, useEffect } from 'react';
import { useAtom, atom } from 'jotai';
import type { PRData, PRAnalysisResult, Checklist } from '../types';
import { prDataStorage } from '../services/prDataService';
import { generatingAtom } from '@src/atoms/generatingAtom';
import { loadPRDataFromAnySource, fetchAndSetPRData } from './prDataLoader';
import { getApprovedFiles, getApprovalPercentage } from '../utils/prApprovalUtils';

const currentPrDataAtom = atom<PRData | null>(null);

// PRデータを管理するためのカスタムフック
export function usePRData(prKey: string) {
  const [prData, setPRData] = useAtom(currentPrDataAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PRAnalysisResult | undefined>(undefined);
  const [previousApprovalPercentage, setPreviousApprovalPercentage] = useState<number | null>(null);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [isGenerating] = useAtom(generatingAtom);

  // PR情報を取得する関数
  useEffect(() => {
    if (isGenerating) return;
    setPreviousApprovalPercentage(null);
    setIsJustCompleted(false);
    setIsLoading(true);
    setError(null);
    loadPRDataFromAnySource(prKey, setPRData, setAnalysisResult, setError).finally(() => setIsLoading(false));
  }, [prKey, isGenerating, setPRData]);

  // 分析結果を保存する関数
  const saveAnalysisResultSummary = async (summary: string) => {
    if (!prData || !prKey) return;

    const newResult = {
      ...analysisResult,
      summary,
    } as PRAnalysisResult;

    setAnalysisResult(newResult);

    try {
      await prDataStorage.saveToStorage(prKey, prData, newResult);
    } catch (err) {
      console.error('Error saving analysis result:', err);
    }
  };

  const saveAnalysisResultChecklist = async (fileChecklist: Checklist) => {
    if (!prData || !prKey) return;

    let newFileAnalysis: Checklist[];

    // すでに分析結果にchecklistと同じファイル名が存在する場合は更新
    if (analysisResult?.fileAnalysis?.some(item => item.filename === fileChecklist.filename)) {
      newFileAnalysis = analysisResult.fileAnalysis.map(item =>
        item.filename === fileChecklist.filename ? fileChecklist : item,
      );
    } else {
      // 含まれない場合は新しいチェックリストを追加
      newFileAnalysis = (analysisResult?.fileAnalysis || []).concat(fileChecklist);
    }

    const newResult = {
      ...analysisResult,
      fileAnalysis: newFileAnalysis,
    } as PRAnalysisResult;

    setAnalysisResult(newResult);

    try {
      await prDataStorage.saveToStorage(prKey, prData, newResult);
    } catch (err) {
      console.error('Error saving analysis result:', err);
    }
  };

  // データを強制的に再読み込みする関数
  const refreshData = async () => {
    if (!prKey) return;

    await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading, analysisResult);
  };

  // PRデータをAPIから再取得して状態を更新する関数
  const reloadPRData = async () => {
    if (!prKey) return null;
    setIsLoading(true);
    setError(null);
    try {
      await fetchAndSetPRData(prKey, setPRData, setError, setIsLoading, analysisResult);
      return prData;
    } catch {
      setError('Failed to reload PR data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 現在の承認状態を計算
  const approvedFilesCount = prData && analysisResult ? getApprovedFiles(prData, analysisResult) : 0;

  const currentApprovalPercentage = prData && analysisResult ? getApprovalPercentage(prData, analysisResult) : null;

  // 承認率の変化を監視し、完了状態を検出する
  useEffect(() => {
    if (currentApprovalPercentage === 100 && previousApprovalPercentage !== null && previousApprovalPercentage < 100) {
      setIsJustCompleted(true);
    } else if (currentApprovalPercentage !== previousApprovalPercentage) {
      setIsJustCompleted(false);
      setPreviousApprovalPercentage(currentApprovalPercentage);
    }
  }, [currentApprovalPercentage, previousApprovalPercentage]);

  // isJustCompletedがtrueになったら5秒後にfalseに戻す
  useEffect(() => {
    if (isJustCompleted) {
      const timer = setTimeout(() => {
        setIsJustCompleted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isJustCompleted]);

  return {
    prData,
    isLoading,
    error,
    analysisResult,
    saveAnalysisResultSummary,
    saveAnalysisResultChecklist,
    refreshData,
    reloadPRData,
    approvedFilesCount,
    currentApprovalPercentage,
    isJustCompleted,
  };
}

```

---
# layouts/README.md

# pages/side-panel/src/layouts

## Overview

This folder, named `layouts`, contains the layout components for the side panel application. Its primary purpose is to define the overall structure and visual framework of the application's pages, ensuring a consistent user experience across different sections. It handles common elements like the header, content area, and navigation, providing a reusable template for displaying various pages.

## Naming Conventions

*   Component filenames should use PascalCase (e.g., `Layout.tsx`).
*   Class names in JSX should follow the BEM (Block, Element, Modifier) naming convention.

## Design Policy

*   The layouts should provide a consistent look and feel across the application.
*   Responsiveness is a key design consideration.  Layouts should adapt to different screen sizes and devices.
*   Prioritize a clean and intuitive user interface.

## Technologies and Libraries Used

*   **React:**  For building the user interface.
*   **React Router:** For navigation and routing between different pages.
*   **Tailwind CSS:** For styling and layout.

## File Roles

| File Name      | Role                                             | Logic and Functions                                                                                                                                                                        | Names of other files used    |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `Layout.tsx`   | Defines the main application layout.           | - Renders the header, main content area (`Outlet`), and optionally a settings button.<br>- Uses `useLocation` to conditionally render the settings button based on the current route.<br>- Uses `useNavigate` to handle navigation to the home route. | `Header`, `SettingsButton`   |

## Code Style and Examples

### Layout Component Structure

The `Layout` component utilizes the following structure:

```jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SettingsButton from '../components/SettingsButton';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="layout-container">
      <Header />

      <main className="content-container">
        <Outlet />
      </main>

      {!isSettingsPage && (
        <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center bg-blue-500 hover:bg-blue-600 p-3 rounded-full shadow-lg text-white transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 01-1-1h-2a1 1 0 001 1v4a1 1 0 011 1h2"
              />
            </svg>
          </button>
          <SettingsButton className="bg-blue-500 hover:bg-blue-600 p-3 rounded-full shadow-lg text-white transition-all duration-300" />
        </div>
      )}
    </div>
  );
};

export default Layout;
```

### Conditional Rendering with `useLocation`

The `useLocation` hook from `react-router-dom` is used to determine the current route and conditionally render elements based on it.  For example, the settings button is only rendered when the user is *not* on the settings page.

```javascript
const location = useLocation();
const isSettingsPage = location.pathname === '/settings';

{!isSettingsPage && (
  // ...Settings Button JSX...
)}
```

### Navigation with `useNavigate`

The `useNavigate` hook is used for programmatically navigating between routes.  In the example, the button navigates the user to the home route ("/").

```javascript
const navigate = useNavigate();

<button onClick={() => navigate('/')}>...</button>
```

## File Templates and Explanations

The `Layout` component serves as a template for other layouts. It provides a basic structure with a header and content area. When creating a new layout, start by duplicating and modifying this file.

## Coding Rules Based on the Above

*   Always use PascalCase for component filenames.
*   Use BEM naming convention for CSS classes within JSX.
*   Favor functional components using hooks.
*   Ensure all layouts are responsive and adapt to different screen sizes.
*   Keep layouts clean and maintainable.

## Notes for Developers

*   When modifying layouts, thoroughly test the changes on different screen sizes.
*   Be mindful of performance implications when adding complex logic to layout components.
*   Document any new layout components or significant changes to existing ones.

---
# routes/README.md

# pages/side-panel/src/routes

## Overview

This folder, named `routes`, is responsible for defining and managing the application's navigation structure and routing logic. It uses `react-router-dom` to create a memory router that renders different views based on the URL. This allows the side panel application to navigate between different sections, such as the default view, settings, GitHub PR view, GitHub token setup view, and OpenAI token setup view.

- **Folder Name:** routes
- **Purpose:** Defines and manages the application's routing and navigation.

## Naming Conventions

*   File names should be descriptive and use PascalCase (e.g., `AppRoutes.tsx`).
*   Route paths should be lowercase and use hyphens to separate words (e.g., `/github-token-setup`).
*   Variables and constants should use camelCase (e.g., `router`, `routes`).

## Design Policy

*   The routing structure should be clear and intuitive for users.
*   Each route should correspond to a specific view or functionality.
*   Routes should be defined in a central location (i.e., `AppRoutes.tsx`) for easy maintenance.
*   Context providers (like `NavigationProvider`) should wrap the `RouterProvider` to ensure context is available to all routed components.

## Technologies and Libraries Used

*   **React:** The primary UI library.
*   **react-router-dom:** For handling routing and navigation. Specifically, `createMemoryRouter` and `RouterProvider` are used.
*   **TypeScript:** Provides static typing for improved code quality and maintainability.
*   **Context API (NavigationContext):** Used for managing and sharing navigation-related state across the application.

## File Roles

| File Name      | Role                                  | Logic and Functions                                                                                                                                                                                                                               | Names of other files used                                                                          |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| AppRoutes.tsx  | Defines the application's routes and provides the router. | - Defines an array of route objects, each mapping a URL path to a specific React component (view).<br>- Uses `createMemoryRouter` to create a router instance based on these routes.<br>- Renders the `RouterProvider` to enable routing, wrapped with necessary context providers.   | `DefaultView`, `GitHubPRView`, `SettingsView`, `GithubTokenSetupView`, `OpenAiTokenSetupView`, `Layout`, `NavigationProvider` |

## Code Style and Examples

### Defining Routes

Routes are defined as an array of objects, where each object specifies the `path` and the corresponding `element` (React component) to render.  Child routes are used for nested layouts.

```typescript
export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DefaultView />,
      },
      {
        path: 'settings',
        element: <SettingsView />,
      },
      {
        path: 'pr/:owner/:repo/:prNumber',
        element: <GitHubPRView />,
      },
      {
        path: 'github-token-setup',
        element: <GithubTokenSetupView />,
      },
      {
        path: 'openai-token-setup',
        element: <OpenAiTokenSetupView />,
      },
    ],
  },
];
```

*   `path`: The URL path for the route.
*   `element`: The React component to render when the route is matched.
*   `index`:  If true, the element is rendered when the parent path is matched exactly.
*   `children`: Nested routes within a parent route (for layouts).

### Using `createMemoryRouter`

`createMemoryRouter` is used to create a router instance that stores the navigation history in memory. This is useful for environments where a traditional browser history is not available (e.g., side panels, testing environments).

```typescript
export const router = createMemoryRouter(routes);
```

### Using `RouterProvider`

`RouterProvider` is a component that makes the router available to all child components. It takes the router instance as a prop.

```typescript
const AppRouter = () => {
  return (
    <NavigationProvider>
      <RouterProvider router={router} />
    </NavigationProvider>
  );
};
```

## File Templates and Explanations

**AppRoutes.tsx:** This file serves as the central routing configuration.  It imports all the view components and assembles the route array. It also sets up the `MemoryRouter` with the routes and then wraps the `RouterProvider` with the `NavigationProvider` for context availability. This file should be modified whenever a new route or view is added to the application.

## Coding Rules Based on the Above

*   Always define routes in `AppRoutes.tsx`.
*   Use `createMemoryRouter` for routing in the side panel environment.
*   Wrap the `RouterProvider` with necessary context providers.
*   Ensure that each route has a corresponding React component.
*   Follow the defined naming conventions.
*   Use TypeScript for type safety.

## Notes for Developers

*   When adding a new route, ensure that the corresponding component is created and imported correctly.
*   Pay attention to the order of routes, as the router matches routes in the order they are defined.  More specific routes (e.g., `/pr/:owner/:repo/:prNumber`) should be placed before more general routes (e.g., `/settings`).
*   Consider using lazy loading for components to improve initial load time.
*   Use the `useNavigate` hook from `react-router-dom` for programmatic navigation.

---
# services/README.md

# pages/side-panel/src/services

## Overview

The `services` folder contains services responsible for interacting with external APIs (like GitHub and OpenAI/Gemini) and managing data related to pull requests within the extension. These services handle data fetching, processing, and storage, providing a clean and abstracted interface for other parts of the extension.

- **Folder name:** services
- **Purpose:** To provide reusable services for data fetching, API interaction (GitHub, OpenAI/Gemini), and data management.

## Naming Conventions

-   Filenames are in camelCase (e.g., `aiService.ts`, `github.ts`).
-   Class names are in PascalCase (e.g., `GithubClient`, `OpenAIClient`).
-   Function names are in camelCase (e.g., `fetchPullRequest`, `generateAnalysis`).
-   Constants are in UPPER_SNAKE_CASE (e.g., `STORAGE_KEY`, `MAX_CACHE_SIZE`).

## Design Policy

-   Each service should be responsible for a specific set of tasks (Single Responsibility Principle).
-   Services should be stateless where possible.
-   API interaction logic should be encapsulated within the corresponding service.
-   Error handling should be implemented consistently across all services.
-   Data should be transformed into a consistent format within the services before being passed to other parts of the extension.
-   Configuration details (like API keys) should be handled via storage APIs.

## Technologies and Libraries Used

-   TypeScript: Primary language for development.
-   `@octokit/rest`: For interacting with the GitHub API.
-   `openai`: For interacting with the OpenAI API.
-   `@google/genai`: For interacting with the Gemini API.
-   Chrome Storage API: For storing and retrieving data within the extension.
-   `swr`: A library for React Hooks for Data Fetching (used in `aiService.ts`).

## File Roles

| File Name         | Role                                                                                                 | Logic and Functions                                                                                                                                                                                                                                                                          | Dependencies                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiService.ts`    | Provides fetchers for generating AI analysis, chat responses, checklists, and PR summaries using OpenAI/Gemini. | - `generateAnalysis`: Generates OpenAI/Gemini analysis for a given PR file. Handles invalid PR data and errors.  - `fileChatStream`: Fetches streaming AI chat responses, incorporating PR information into the prompt.  - `generateChecklist`: Generates a file checklist.  - `generateSummaryStream`: Generates PR summary with streaming output. | `@src/types`, `./modelClient`, `@extension/storage`                                                                                                       |
| `gemini.ts`       | Implements the Gemini API client for generating PR checklists and summaries.                            | - `GeminiClient.analyzePR`: Analyzes a PR and generates a checklist using the Gemini API. Includes error handling.  - `GeminiClient.callGemini`: Makes the API call to Gemini with a given prompt.  - `GeminiClient.streamChatCompletion`: Streams chat completion responses from Gemini.   - `geminiApiKeyStorage`: Provides utility functions to manage Gemini API Key in Chrome Storage | `@src/types`, `@google/genai`, `./modelClient`, `@extension/storage`                                                                                                       |
| `github.ts`       | Implements the GitHub API client for fetching PR data, file content, and reviews.                   | - `GithubClient.fetchPullRequest`: Fetches pull request data.  - `GithubClient.fetchPullRequestFiles`: Fetches the list of files in a pull request.  - `GithubClient.fetchFileContent`: Fetches the content of a file from GitHub.  - `GithubClient.fetchPullRequestReviews`: Fetches reviews for a pull request.  - `GithubClient.fetchCopilotInstructionsFromMain`: Fetches content of `.github/copilot-instructions.md` from the main branch. - `GithubClient.fetchReadmeContent`: Fetches the content of the README.md file. - `GithubClient.fetchBlob`: Fetches a specific blob.  - `GithubClient.fetchPullRequestReviewComments`: Fetches review comments for a pull request. | `@octokit/rest`, `@extension/storage`, `../types`                                                                                                     |
| `modelClient.ts`  | Defines the common interface for LLM clients (OpenAI, Gemini) and provides a factory function to create them.  | - `ModelClient`: Interface defining common methods for LLM clients (analyzePR, streamChatCompletion).  - `createModelClient`: Factory function that creates either an OpenAI or Gemini client based on the stored preference.  - `buildPRAnalysisPrompt`: Builds the prompt for PR analysis to be sent to the LLM. | `@src/types`, `./openai`, `./gemini`, `@extension/storage`                                                                                                 |
| `openai.ts`       | Implements the OpenAI API client for generating PR checklists and summaries.                            | - `OpenAIClient.analyzePR`: Analyzes a PR and generates a checklist using the OpenAI API. Includes error handling.  - `OpenAIClient.callOpenAI`: Makes the API call to OpenAI with a given prompt.  - `OpenAIClient.streamChatCompletion`: Streams chat completion responses from OpenAI.  - `openaiApiKeyStorage`: Provides utility functions to manage OpenAI API Key in Chrome Storage  - `languagePreferenceStorage`: Provides utility functions to manage language preferences in Chrome Storage - `openaiApiEndpointStorage`: Provides utility functions to manage openai endpoint in Chrome Storage | `@src/types`, `openai`, `./modelClient`, `@extension/storage`                                                                                                  |
| `prDataService.ts` | Provides services for fetching and managing PR data (fetching from GitHub, saving to local storage). | - `PRDataStorage.saveToStorage`: Saves PR data to local storage, managing cache size and updating recent PRs.  - `PRDataStorage.getFromStorage`: Retrieves PR data from local storage by key.  - `PRDataStorage.getAllFromStorage`: Retrieves all PR data from local storage.  - `PRDataStorage.removeFromStorage`: Removes PR data from local storage by key.  - `fetchPRData`: Fetches PR data from GitHub, including file content, review data and user comments.| `../types`, `./github`                                                                                                                                 |

## Code Style and Examples

-   Use async/await for asynchronous operations.
-   Implement error handling with try/catch blocks.
-   Use descriptive variable and function names.
-   Use type annotations for all variables and function parameters.
-   Keep functions short and focused.

**Example (aiService.ts):**

```typescript
export const fetchers = {
  generateAnalysis: async (prData: PRData, file: PRFile, language: Language) => {
    try {
      const client = await createModelClient();
      const analysisResult = await client.analyzePR(prData, file, language);
      return analysisResult;
    } catch (error) {
      console.error('Error in generateAnalysis fetcher:', error);
      throw error;
    }
  },
};
```

**Example (github.ts):**

```typescript
async fetchPullRequest(identifier: PRIdentifier) {
    const { owner, repo, prNumber } = identifier;
    return this.octokit.pulls.get({ owner, repo, pull_number: Number(prNumber) });
  }
```

## File Templates and Explanations

A typical service file should include:

1.  **Imports:** Import necessary types, modules, and other services.
2.  **Class Definition (if applicable):** Define a class encapsulating the service's functionality.
3.  **Methods:** Implement the service's methods, handling API calls, data processing, and error handling.
4.  **Storage Utilities (if applicable):** Define utilities for interacting with Chrome Storage API.
5.  **Factory Function (if applicable):** Provide a factory function for creating instances of the service class.

## Coding Rules

-   **API Key Management:** API keys must be stored securely using the Chrome Storage API and should never be hardcoded.
-   **Error Handling:** All API calls and asynchronous operations must include proper error handling. Log errors and re-throw or return appropriate error messages.
-   **Data Validation:** Validate data received from external APIs to ensure it conforms to the expected schema.
-   **Asynchronous Operations:** Use `async/await` for asynchronous operations to improve code readability.
-   **Singletons:** For classes like `GithubClient`, use the singleton pattern.
-   **String Literals:** Use backticks for string literals that contain template literals.

## Notes for Developers

-   When adding a new service, ensure it adheres to the design principles and coding conventions outlined above.
-   When modifying existing services, ensure that changes are backward-compatible and do not introduce new dependencies.
-   Thoroughly test all services to ensure they function correctly and handle errors gracefully.
-   Document all services and their methods using JSDoc-style comments.
-   Consider the performance implications of each service and optimize where necessary.  For example, caching data in Chrome Storage can reduce the number of API calls.
-   Remember to update this README.md file whenever you modify or add a new service.

---
# types/README.md

# `types` Folder

## Overview

The `types` folder houses the TypeScript type definitions used within the side panel application. These type definitions ensure type safety and improve code maintainability by providing clear contracts for data structures used across different components and modules.  They define the shape of data related to pull requests, repositories, analysis results, and the application's internal state.

- **Folder name:** `types`
- **Purpose of the folder:** Defines TypeScript interfaces and types for data structures used within the side panel application.

## Naming Conventions

- Interfaces are named with a capitalized first letter (PascalCase) and typically end with `Data`, `Item`, or `Result` to clearly indicate their purpose.  For example, `PRData`, `ChecklistItem`, `PRAnalysisResult`.
- Type aliases use PascalCase as well, such as `ChecklistItemStatus`.
- Boolean properties often use the `is` prefix, such as `isPRPage`.

## Design Policy

The type definitions are designed to accurately represent the structure of the data received from the GitHub API and used within the application.  They aim to be comprehensive and reflect all the necessary properties with correct data types. Type definitions are only added when multiple components or modules require the same data structure to ensure reusability and consistency.

## Technologies and Libraries Used

- TypeScript

## File Roles

| File name    | Role                                                       | Logic and functions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Names of other files used |
|--------------|------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| `index.ts`   | Defines all TypeScript interfaces and type aliases.       | - `PRFile`: Defines the structure of a single file within a pull request, including filename, status, additions, deletions, patch, and content URL. It includes `decodedContent` for storing the decoded content of the file. <br> - `PRData`: Defines the overall structure of pull request data, including information about the PR, its author, associated files, commits, and comments. It also includes `copilot_instructions` and `readme` for storing analysis results. It further contains `userComments` to hold user-provided comments on the PR.<br> - `PRIdentifier`: Defines the structure for identifying a pull request by owner, repository, and PR number. <br> - `SavedPRData`: Defines the structure for storing PR data locally, including the data itself, a timestamp, and an analysis result. <br> - `CurrentPage`: Defines the structure for representing the current page in the browser, including URL, title, and PR identification information. <br> - `ChecklistItemStatus`: Defines a type alias for the possible statuses of a checklist item. <br> - `ChecklistItem`: Defines the structure for a single checklist item, including its ID, description, and status. <br> - `Checklist`: Defines the structure for a checklist associated with a file, including its filename, explanation, and checklist items. <br> - `PRAnalysisResult`: Defines the structure for the overall PR analysis result, including a summary and file-specific analyses. <br> - `PRUserComment`: Defines the structure for a user comment associated with a pull request, including user information, path, comment body, and timestamps.  | None                        |

## Code Style and Examples

### Interface Definition

Interfaces are defined using the `interface` keyword and specify the properties and their corresponding types.

```typescript
export interface PRData {
  id: number;
  title: string;
  // ... other properties
}
```

### Type Alias Definition

Type aliases are defined using the `type` keyword and provide a shorthand name for a type.

```typescript
export type ChecklistItemStatus = 'OK' | 'WARNING' | 'ERROR' | 'PENDING';
```

### Optional Properties

Optional properties are denoted with a `?` after the property name.

```typescript
export interface PRFile {
  patch?: string; // patch is optional
}
```

## File Templates and Explanations

When creating a new type definition:

1.  **Name the interface or type alias descriptively.**  The name should clearly indicate the purpose of the type.
2.  **Define all relevant properties with appropriate types.**  Use TypeScript's type system to enforce type safety.
3.  **Consider adding comments to explain the purpose of each property.** This improves code readability and maintainability.
4.  **Add the new type definition to `index.ts`.**
5.  **Ensure consistency with existing type definitions.**  Use similar naming conventions and coding styles.

## Coding Rules Based on the Above

1.  All data structures used across multiple components must have explicit TypeScript type definitions in the `types` folder.
2.  Type definitions should be comprehensive and accurately reflect the structure of the data.
3.  Follow the naming conventions outlined above.
4.  Use optional properties when a property may not always be present in the data.
5.  Add comments to explain the purpose of each type and property.
6.  Ensure that all type definitions are exported from `index.ts`.

## Notes for Developers

- When modifying existing type definitions, consider the impact on other components that use those types.  Make sure to update those components accordingly.
- Use caution when adding new dependencies to the `types` folder, as this can increase the bundle size. If possible, use built-in TypeScript types or type aliases.
- Regularly review the type definitions to ensure they are still accurate and up-to-date. Ensure to add detailed comments to each interface and property to enhance understanding and future maintenance. Pay special attention to new properties and complex data structures.

---
# utils/README.md

# pages/side-panel/src/utils

## Overview

This folder, named `utils`, contains utility functions used within the side panel component. These functions primarily focus on processing and calculating data related to pull requests (PRs), such as approval status, estimated review time, and general PR information. They abstract complex logic, making the main component code cleaner, more readable, and easier to maintain.

- **Folder Name:** `utils`
- **Purpose:** Provides utility functions for calculating, processing, and extracting PR-related data in the side panel.

## Naming Conventions

-   Function names should clearly describe their purpose (e.g., `calculateReviewTime`, `getApprovedFiles`, `extractPRInfoFromKey`).
-   Variable names should be descriptive and concise.
-   Filenames should relate to the general functionality of the functions they contain (e.g., `prApprovalUtils.ts` for PR approval-related utilities, `reviewTimeUtils.ts` for review time calculation).

## Design Policy

-   Functions should be designed to be reusable and testable.
-   Avoid side effects where possible. Functions should ideally be pure, meaning they return the same output for the same input and don't modify external state.
-   Type annotations should be used extensively for improved code clarity and maintainability.
-   Error handling should be implemented gracefully, preventing the application from crashing due to unexpected data or invalid inputs. Consider returning `null` or throwing an error when appropriate.

## Technologies and Libraries Used

-   TypeScript: For type safety, improved code organization, and enhanced maintainability.

## File Roles

| File Name              | Role                                                                                                                             | Logic and Functions                                                                                                                                                                                                                                                                                                                                                                                                          | Names of other files used |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `prApprovalUtils.ts`   | Provides utility functions for determining PR approval status and calculating the approval percentage.                                | - `getApprovedFiles`: Filters PR files to find those that have passed all checklist items in `analysisResult`. Returns the number of approved files.<br>- `getApprovalPercentage`: Calculates the percentage of approved files in a PR.  Returns `null` if `prData` is null or `prData.files` is empty to handle cases where there are no files to analyze.                                                                                                                                            | `../types`                |
| `prUtils.ts`           | Contains general utility functions related to PR data and information extraction, including review time calculation and URL validation.  | - `calculateReviewTime`: Calculates the review time of a PR in hours, considering the creation and merge time. Returns 0 if `prData.created_at` is null.<br>- `isGitHubPRPage`: Checks if a given URL is a GitHub PR page using a regular expression to match the URL pattern.  <br>- `extractPRInfoFromKey`: Extracts the owner, repo, and PR number from a key string (e.g., "owner/repo/123"). Returns `null` if the key doesn't match the expected format.<br>- `getPrKey`: Constructs a PR key string from the owner, repo, and PR number. Throws an error if any of the inputs are undefined. | `../types`                |
| `reviewTimeUtils.ts` | Provides utility functions for estimating PR review time based on file size and number of changes.                             | - `calculateReviewTime`: Calculates an estimated review time in minutes based on the number of files and changes in a PR. The logic uses different thresholds for small, medium and large PRs. Returns an object with a `minutes` property representing the estimated review time. The function uses `Math.max` to ensure a minimum review time for each category.                                                                                                          | `../types`                |

## Code Style and Examples

-   **`prApprovalUtils.ts`**
    ```typescript
    import type { PRData, PRAnalysisResult } from '../types';

    export const getApprovedFiles = (prData: PRData | null, analysisResult: PRAnalysisResult | undefined): number => {
      if (!prData || !analysisResult) return 0;
      return prData.files.filter(file => {
        const fileChecklist = analysisResult.fileAnalysis?.find(checklist => checklist.filename === file.filename);
        if (!fileChecklist) return false;
        return fileChecklist.checklistItems.every(item => item.status === 'OK');
      }).length;
    };
    ```
    This example shows how to filter files based on checklist item status. It utilizes optional chaining (`?.`) to safely access nested properties and the `every` method to ensure all checklist items are `OK`. It also demonstrates handling null or undefined inputs by returning 0.

-   **`prUtils.ts`**
    ```typescript
    import type { PRData } from '../types';

    export const calculateReviewTime = (prData: PRData): number => {
      if (!prData.created_at) {
        return 0;
      }

      const reviewStartTime = new Date(prData.created_at).getTime();
      let reviewEndTime: number;

      if (prData.merged_at) {
        reviewEndTime = new Date(prData.merged_at).getTime();
      } else {
        reviewEndTime = Date.now();
      }

      const diffInHours = (reviewEndTime - reviewStartTime) / (1000 * 60 * 60);
      return Math.round(diffInHours * 10) / 10;
    };
    ```
    This example demonstrates date handling and time difference calculation in JavaScript.  It also shows how to handle cases where a PR might not be merged yet, and gracefully deal with missing data by returning `0`.

-   **`reviewTimeUtils.ts`**
    ```typescript
    import type { PRData } from '../types';

    export const calculateReviewTime = (prData: PRData): { minutes: number } => {
      const totalFiles = prData.files.length;
      const totalChanges = prData.files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
      let minutes = 0;
      if (totalChanges < 100 && totalFiles < 5) {
        minutes = Math.max(5, Math.ceil(totalChanges / 10));
      } else if (totalChanges < 500 && totalFiles < 20) {
        minutes = Math.max(10, Math.ceil(totalChanges / 8));
      } else {
        minutes = Math.max(30, Math.ceil(totalChanges / 5));
      }
      return { minutes };
    };
    ```
    This function calculates an estimated review time based on the number of files and the total number of additions and deletions. It includes logic to apply different calculation strategies depending on the size of the pull request.

## File Templates and Explanations

All files in this directory are TypeScript modules. They typically follow this template:

```typescript
import type { SomeType } from '../types';

/**
 * A brief description of the function.
 *
 * @param {SomeType} parameterName Description of the parameter.
 * @returns {ReturnType} Description of the return value.
 */
export const functionName = (parameterName: SomeType): ReturnType => {
  // Implementation logic here
  return someValue;
};
```

-   **Imports:** Import necessary types or other modules at the beginning of the file.
-   **JSDoc Comments:** Use JSDoc-style comments to document functions, parameters, and return types.
-   **Exports:** Export functions that need to be used in other modules.

## Coding Rules

-   **Type Safety:** Utilize TypeScript's type system to catch errors early and improve code reliability.
-   **Immutability:** Avoid modifying input data directly. Create copies when necessary to maintain data integrity.
-   **Error Handling:** Handle potential errors gracefully, using `try...catch` blocks or conditional checks where appropriate. Consider returning `null` or throwing errors when necessary to signal invalid states.
-   **Code Comments:** Write clear and concise comments to explain complex logic or non-obvious behavior.
-   **Testing:** Write unit tests for all utility functions to ensure they function correctly and cover edge cases.
-   **Single Responsibility Principle:** Each function should have a single, well-defined purpose.
-   **Keep functions short and focused:** Break down complex tasks into smaller, more manageable functions.
-   **Avoid deeply nested logic:** Simplify complex conditional statements to improve readability.

## Notes for Developers

-   When adding new utility functions, consider their reusability and place them in the appropriate file.
-   Ensure that all functions are well-documented and follow the established coding conventions.
-   When modifying existing functions, be mindful of potential side effects and ensure that the changes don't break existing functionality.
-   Prioritize code readability and maintainability.
-   When handling edge cases or potential errors, choose the most appropriate approach (e.g., returning `null`, throwing an error, or providing a default value).
-   Be consistent with the existing coding style and conventions.

---
# views/README.md

# pages/side-panel/src/views

## Overview

This folder, named `views`, houses the React components that define the main views or pages displayed within the side panel of the browser extension. These views handle user interactions, display data, and manage the overall user experience. They are responsible for rendering the UI and orchestrating the logic for different functionalities of the extension, such as entering a PR URL, displaying analysis results, and configuring settings.

- **Folder Name:** views
- **Purpose:** Contains the React components representing the main views/pages of the side panel extension.

## Naming Conventions

-   Component filenames use PascalCase (e.g., `DefaultView.tsx`).
-   Variables and functions use camelCase (e.g., `handleUrlChange`).
-   Filenames should clearly reflect the component's primary role or function.

## Design Policy

-   Each view component should be self-contained and responsible for a specific function of the extension.
-   UI should be clear, intuitive, and user-friendly.
-   Components should be reusable and maintainable.
-   Use Tailwind CSS for consistent styling across all views.

## Technologies and Libraries Used

-   **React:** For building the UI components.
-   **TypeScript:** For type safety and code maintainability.
-   **Tailwind CSS:** For styling the components.
-   **react-router-dom:** For managing navigation between different views.
-   **@extension/i18n:** For internationalization (i18n) support.
-   **@extension/storage:** For interacting with browser storage to persist data.
-   **react-rewards:** For providing visual rewards, such as confetti, upon task completion.
-   **Jotai:** For simple global state management.

## File Roles

| File Name              | Role                                                              | Logic and Functions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Names of other files used (Dependencies)                                                                                                              |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DefaultView.tsx`      | Default view for entering and navigating to GitHub PRs.            | - `useState`: Manages the input URL, validation status, recent PRs, and visibility of all recent PRs.  - `useEffect`: Loads recent PRs from local storage on component mount. Sorts recent PRs by timestamp (most recent first).  - `validateUrl`: Validates the entered URL using `isGitHubPRPage`.  - `handleUrlChange`: Updates the URL state and validates it.  - `handleGoToPR`: Navigates to the PR using `navigateToPr` if the URL is valid.  - `handleRecentPRClick`: Navigates to a PR from history using `navigateToPrFromHistory`, extracting PR information using `extractPRInfoFromKey`.  - Logic to display either the first 5 recent PRs or all, with a button to toggle.  - Implements conditional rendering based on URL validation and the presence of recent PRs. | `../context/NavigationContext`, `../utils/prUtils`                                                                                                |
| `GitHubPRView.tsx`     | View for displaying GitHub PR data and analysis.                    | - `useParams`: Extracts the `owner`, `repo`, and `prNumber` from the URL.  - `usePRData` hook: Fetches PR data, loading state, analysis results, and approval percentage.  - `useEffect`: Triggers confetti effect when PR is marked as complete (100% approval).  - Renders loading state, error state, or PR data based on the current state.  - Displays review progress with approved files count and estimated review time calculated using `calculateReviewTime`. - Uses `useRef` and `useEffect` to reset loading state when the PR key changes.                                                                                                                                                                                 | `../hooks/usePRData`, `../utils/prUtils`, `../components/PRAnalysis`, `react-rewards`, `react-router-dom`                                          |
| `GithubTokenSetupView.tsx` | View for setting up the GitHub Personal Access Token.           | - `useState`: Manages the token input, loading state, and error messages.  - `useEffect`: Loads API domain from storage.  - `handleSubmit`: Handles form submission, validates the token, and saves it to storage.  - Navigates to the home view or OpenAI token setup view after successful token saving.                                                                                                                                                                                                                                                                                                                                                     | `@extension/storage`, `@src/context/NavigationContext`, `@src/hooks/useOpenaiKeyAtom`                                                            |
| `OpenAiTokenSetupView.tsx` | View for setting up the OpenAI API key.                         | - `useState`: Manages the API key input, loading state, selected provider, and error messages. - `useEffect`: Sets initial provider from the model client type Jotai atom.  - `handleSubmit`: Handles form submission, validates the API key using provider specific validation, and saves it to storage.  - A `getMaskedApiKey` function provides a masked display of the API key for privacy.  - Manages selection of provider (OpenAI, Gemini) and corresponding API Key input using a select element. - `handleProviderChange`: Persists the selected provider to storage using the `useModelClientTypeAtom` hook.   | `../context/NavigationContext`, `@extension/i18n`, `../hooks/useOpenaiKeyAtom`, `@src/hooks/useGeminiKeyAtom`, `../hooks/useModelClientTypeAtom` |
| `SettingsView.tsx`       | View for managing extension settings (language, API keys, etc.). | - `useState`: Manages the language, OpenAI API endpoint, recent PRs, toast visibility, and model client type (OpenAI or Gemini).  - `useEffect`: Loads settings from storage on component mount.  - `handleLanguageChange`: Handles language selection and saves it to storage, also updating `chrome.storage.local` and `localStorage` (for dev). - `handleModelClientTypeChange`: Handles selection of the AI provider and saves it to storage using the `useModelClientTypeAtom` hook. - Displays settings forms for GitHub integration, OpenAI API key, and language preference. Displays toast messages for user feedback. | `../context/NavigationContext`, `../components/OpenAIKeySettings`, `../components/GitHubIntegrationSettings`, `../components/GeminiKeySettings`, `../services/modelClient`, `@extension/storage`, `@extension/i18n`, `../components/Toast`, `../hooks/useModelClientTypeAtom`       |

## Code Style and Examples

-   Use functional components with hooks for managing state and side effects.
-   Use Tailwind CSS classes for styling.
-   Keep components small and focused on a single responsibility.
-   Use descriptive variable and function names.

**Example: Handling URL Input in `DefaultView.tsx`**

```typescript
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPrUrl(newUrl);
    validateUrl(newUrl);
  };

  const validateUrl = (url: string) => {
    const isValid = isGitHubPRPage(url);
    setIsValid(isValid);
    return isValid;
  };

  <input
    type="text"
    id="pr-url"
    value={prUrl}
    onChange={handleUrlChange}
    placeholder="https://github.com/owner/repo/pull/123"
    className={`flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 ${
      prUrl && !isValid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
    }`}
  />
```

**Example: Fetching and Displaying PR Data in `GitHubPRView.tsx`**

```typescript
  const { owner, repo, prNumber } = useParams<{ owner: string; repo: string; prNumber: string }>();
  const {
    prData,
    isLoading,
    error: prError,
  } = usePRData(getPrKey(owner, repo, prNumber));

  if (isLoading) {
    return <div>Loading PR data...</div>;
  }

  if (prError) {
    return <div>Error loading PR data</div>;
  }

  {prData && (
    <div>
      <h1>{prData.title}</h1>
      {/* Display other PR data */}
    </div>
  )}
```

## File Templates and Explanations

**Basic View Component Template:**

```typescript
import React from 'react';

interface Props {
  // Define component props here
}

const ComponentName: React.FC<Props> = (props) => {
  // Component logic and state management

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```

**Explanation:**

-   Import `React` from 'react'.
-   Define the component's props using a TypeScript interface (optional, but recommended).
-   Create a functional component using the `React.FC` type.
-   Implement the component's logic and state management using hooks.
-   Return the JSX to render the component's UI.

## Coding Rules Based on the Above

-   All components must be written in TypeScript.
-   Use functional components with hooks for state management.
-   Follow the naming conventions outlined above.
-   Write unit tests for all components.
-   Use Tailwind CSS for styling and ensure consistent UI across all views.
-   Handle errors gracefully and provide informative error messages to the user.
-   Use internationalization (i18n) for all user-facing text.
-   Use Jotai for simple global state management.

## Notes for Developers

-   When adding new views, ensure they are properly integrated into the navigation context.
-   Consider the performance implications of fetching and rendering large amounts of data.
-   Thoroughly test all changes before committing them.
-   Keep the code clean, well-documented, and easy to understand.
-   When modifying existing views, ensure that the changes do not introduce regressions or break existing functionality.
