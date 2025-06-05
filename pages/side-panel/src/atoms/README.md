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

## Notes for Developers

*   Remember to import atoms from their respective files when using them in components.
*   Consider using derived atoms for complex state transformations. This can help keep your code organized and maintainable.
*   When updating an atom's value, always use the `setCurrentPage` function returned by the `useAtom` hook.
