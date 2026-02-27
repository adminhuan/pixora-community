import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MainLayout = () => (
  <div className="app-shell">
    <Navbar />
    <main className="page-container">
      <div className="main-grid">
        <div className="main-content">
          <Outlet />
        </div>
        <div className="layout-sidebar">
          <Sidebar />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);
