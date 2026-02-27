import { useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useSiteName } from '../hooks/useSiteName';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumb } from './Breadcrumb';
import { SideMenu } from './SideMenu';

const { Sider, Content } = Layout;

export const AdminLayout = () => {
  const { siteName } = useSiteName();

  useEffect(() => {
    document.title = `${siteName}管理后台`;
  }, [siteName]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={240} breakpoint="lg" collapsedWidth="70">
        <div
          style={{
            height: 64,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            color: 'var(--admin-primary)',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          {siteName}管理
        </div>
        <SideMenu />
      </Sider>
      <Layout>
        <AdminHeader siteName={siteName} />
        <Content className="admin-content">
          <AdminBreadcrumb />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
