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
