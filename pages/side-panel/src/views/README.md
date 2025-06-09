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
