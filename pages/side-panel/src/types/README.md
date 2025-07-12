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
| `index.ts`   | Defines all TypeScript interfaces and type aliases.       | - `PRFile`: Defines the structure of a single file within a pull request, including filename, status, additions, deletions, patch, and content URL. It includes `decodedContent` for storing the decoded content of the file. <br> - `PRData`: Defines the overall structure of pull request data, including information about the PR, its author, associated files, commits, and comments. It also includes `instructions` and `readme` for storing analysis results. It further contains `userComments` to hold user-provided comments on the PR.<br> - `PRIdentifier`: Defines the structure for identifying a pull request by owner, repository, and PR number. <br> - `SavedPRData`: Defines the structure for storing PR data locally, including the data itself, a timestamp, and an analysis result. <br> - `CurrentPage`: Defines the structure for representing the current page in the browser, including URL, title, and PR identification information. <br> - `ChecklistItemStatus`: Defines a type alias for the possible statuses of a checklist item. <br> - `ChecklistItem`: Defines the structure for a single checklist item, including its ID, description, and status. <br> - `Checklist`: Defines the structure for a checklist associated with a file, including its filename, explanation, and checklist items. <br> - `PRAnalysisResult`: Defines the structure for the overall PR analysis result, including a summary and file-specific analyses. <br> - `PRUserComment`: Defines the structure for a user comment associated with a pull request, including user information, path, comment body, and timestamps.  | None                        |

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
