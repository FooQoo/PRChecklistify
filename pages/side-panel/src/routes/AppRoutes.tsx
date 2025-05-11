import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import DefaultView from '../views/DefaultView';
import GitHubPRView from '../views/GitHubPRView';
import SettingsView from '../views/SettingsView';
import { NavigationProvider } from '../context/NavigationContext';
import Layout from '../layouts/Layout';

// ルート定義
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
    ],
  },
];

// MemoryRouter の作成
export const router = createMemoryRouter(routes);

// RouterProvider コンポーネント
const AppRouter = () => {
  return (
    <NavigationProvider>
      <RouterProvider router={router} />
    </NavigationProvider>
  );
};

export default AppRouter;
