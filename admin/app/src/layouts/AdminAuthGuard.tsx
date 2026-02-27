import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminAuthApi } from '../api/auth';
import { adminAuthStorage } from '../utils/auth';

type GuardStatus = 'checking' | 'allow' | 'deny';

export const AdminAuthGuard = () => {
  const location = useLocation();
  const [status, setStatus] = useState<GuardStatus>('checking');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const token = adminAuthStorage.getAccessToken();
      const cachedUser = adminAuthStorage.getUser();

      if (token && adminAuthStorage.isPrivilegedUser(cachedUser)) {
        if (active) {
          setStatus('allow');
        }
        return;
      }

      try {
        const refreshResponse = await adminAuthApi.refreshToken();
        const refreshData = (refreshResponse?.data ?? {}) as { accessToken?: string };
        const nextToken = String(refreshData.accessToken ?? '').trim();

        if (!nextToken) {
          throw new Error('refresh token missing');
        }

        adminAuthStorage.setAccessToken(nextToken);

        const meResponse = await adminAuthApi.me();
        const me = (meResponse?.data ?? {}) as { id?: string; username?: string; role?: string; email?: string };
        const role = String(me.role ?? '').trim();

        if (!adminAuthStorage.isPrivilegedUser(role ? { role } : null)) {
          throw new Error('forbidden role');
        }

        adminAuthStorage.setUser({
          id: String(me.id ?? ''),
          username: String(me.username ?? '管理员'),
          role,
          email: me.email
        });

        if (active) {
          setStatus('allow');
        }
      } catch {
        adminAuthStorage.clear();
        if (active) {
          setStatus('deny');
        }
      }
    };

    void verify();

    return () => {
      active = false;
    };
  }, []);

  if (status === 'checking') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>正在验证登录状态...</div>;
  }

  if (status === 'deny') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};
