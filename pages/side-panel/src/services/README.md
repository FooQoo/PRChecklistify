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
| `github.ts`       | Implements the GitHub API client for fetching PR data, file content, and reviews.                   | - `GithubClient.fetchPullRequest`: Fetches pull request data.  - `GithubClient.fetchPullRequestFiles`: Fetches the list of files in a pull request.  - `GithubClient.fetchFileContent`: Fetches the content of a file from GitHub.  - `GithubClient.fetchPullRequestReviews`: Fetches reviews for a pull request.  - `GithubClient.fetchCopilotInstructionsFromMain`: Fetches content of `.github/copilot-instructions.md` from the main branch. - `GithubClient.fetchReadmeContent`: Fetches the content of the README.md file. - `GithubClient.fetchBlob`: Fetches a specific blob.  | `@octokit/rest`, `@extension/storage`, `../types`                                                                                                     |
| `modelClient.ts`  | Defines the common interface for LLM clients (OpenAI, Gemini) and provides a factory function to create them.  | - `ModelClient`: Interface defining common methods for LLM clients (analyzePR, streamChatCompletion).  - `createModelClient`: Factory function that creates either an OpenAI or Gemini client based on the stored preference.  - `buildPRAnalysisPrompt`: Builds the prompt for PR analysis to be sent to the LLM. | `@src/types`, `./openai`, `./gemini`, `@extension/storage`                                                                                                 |
| `openai.ts`       | Implements the OpenAI API client for generating PR checklists and summaries.                            | - `OpenAIClient.analyzePR`: Analyzes a PR and generates a checklist using the OpenAI API. Includes error handling.  - `OpenAIClient.callOpenAI`: Makes the API call to OpenAI with a given prompt.  - `OpenAIClient.streamChatCompletion`: Streams chat completion responses from OpenAI.  - `openaiApiKeyStorage`: Provides utility functions to manage OpenAI API Key in Chrome Storage  - `languagePreferenceStorage`: Provides utility functions to manage language preferences in Chrome Storage - `openaiApiEndpointStorage`: Provides utility functions to manage openai endpoint in Chrome Storage | `@src/types`, `openai`, `./modelClient`, `@extension/storage`                                                                                                  |
| `prDataService.ts` | Provides services for fetching and managing PR data (fetching from GitHub, saving to local storage). | - `PRDataStorage.saveToStorage`: Saves PR data to local storage, managing cache size and updating recent PRs.  - `PRDataStorage.getFromStorage`: Retrieves PR data from local storage by key.  - `PRDataStorage.getAllFromStorage`: Retrieves all PR data from local storage.  - `PRDataStorage.removeFromStorage`: Removes PR data from local storage by key.  - `fetchPRData`: Fetches PR data from GitHub, including file content and review data. | `../types`, `./github`                                                                                                                                 |

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
