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
