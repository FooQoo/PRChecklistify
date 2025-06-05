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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 01-1-1h-2a1 1 0 00-1 1v4a1 1 0 011 1h2"
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
