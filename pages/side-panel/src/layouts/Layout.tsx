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
            className="flex items-center bg-blue-500 hover:bg-blue-600 p-3 rounded-full shadow-lg text-white transition-all duration-300 ease-in-out">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
          <SettingsButton className="bg-blue-500 hover:bg-blue-600 p-3 rounded-full shadow-lg text-white transition-all duration-300 ease-in-out flex items-center justify-center" />
        </div>
      )}
    </div>
  );
};

export default Layout;
