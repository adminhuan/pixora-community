import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography } from 'antd';
import { adminAuthApi } from '../../api/auth';
import { useSiteName } from '../../hooks/useSiteName';
import { getErrorMessage } from '../../utils/api';
import { adminAuthStorage } from '../../utils/auth';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { siteName } = useSiteName();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `${siteName}管理后台登录`;
  }, [siteName]);

  const onFinish = async (values: { identifier: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAuthApi.login(values.identifier, values.password);
      const payload = response.data ?? {};
      const user = payload.user as { id?: string; username?: string; role?: string; email?: string } | undefined;

      if (!user?.role || !['admin', 'moderator'].includes(user.role)) {
        throw new Error('当前账号没有后台权限');
      }

      adminAuthStorage.setAccessToken(String(payload.accessToken ?? ''));
      adminAuthStorage.setUser({
        id: String(user.id ?? ''),
        username: String(user.username ?? '管理员'),
        role: String(user.role),
        email: user.email,
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, '登录失败，请检查账号信息'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(160deg, rgba(37,99,235,0.1), rgba(59,130,246,0.04))',
        padding: 20,
      }}
    >
      <Card style={{ width: 'min(420px, 100%)' }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          {siteName}后台登录
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          请输入具备后台权限的账号登录。
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="账号" name="identifier" rules={[{ required: true, message: '请输入邮箱或用户名' }]}>
            <Input placeholder="邮箱 / 用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          {error && (
            <Typography.Text type="danger" role="alert">
              {error}
            </Typography.Text>
          )}
          <Form.Item style={{ marginTop: 12, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录后台
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
