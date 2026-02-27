import { Outlet } from 'react-router-dom';
import { useSiteSettings } from '../hooks';

export const AuthLayout = () => {
  const { siteName } = useSiteSettings();

  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 'min(520px, 100%)',
          borderRadius: 18,
          background: 'var(--ui-card-bg)',
          border: '1px solid var(--ui-card-border)',
          boxShadow: 'var(--ui-shadow)',
          padding: 26,
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, color: 'var(--color-text)' }}>{siteName}账户中心</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--color-textSecondary)', fontSize: 13 }}>
            登录后可同步你的收藏、问答记录与创作数据。
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
