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
