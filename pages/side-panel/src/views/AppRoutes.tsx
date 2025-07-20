import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import DefaultView from './DefaultView';
import GitHubPRView from './GitHubPRView';
import SettingsView from './SettingsView';
import GithubTokenSetupView from './GithubTokenSetupView';
import { NavigationProvider } from './NavigationContext';
import Layout from '../components/templates/Layout';
import AiTokenSetupView from '@src/views/AiTokenSetupView';

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
        path: 'pr/:domain/:owner/:repo/:prNumber',
        element: <GitHubPRView />,
      },
      {
        path: 'github-token-setup',
        element: <GithubTokenSetupView />,
      },
      {
        path: 'openai-token-setup',
        element: <AiTokenSetupView />,
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
