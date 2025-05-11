import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const Layout = () => {
  return (
    <div className="layout-container">
      <Header />
      <main className="content-container">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
