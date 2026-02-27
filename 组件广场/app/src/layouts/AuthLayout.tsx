import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <div className="cp-auth-shell">
    <Outlet />
  </div>
);
