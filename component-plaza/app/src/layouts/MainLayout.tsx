import { Outlet } from 'react-router-dom';
import { useDarkMode } from '../hooks';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export const MainLayout = () => {
  useDarkMode();
  return (
    <div className="cp-shell">
      <Navbar />
      <main className="cp-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
