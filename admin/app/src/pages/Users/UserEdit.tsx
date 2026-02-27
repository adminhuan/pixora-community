import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input } from 'antd';
import { adminUserApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';
import { RoleSelect } from './components/RoleSelect';

const UserEditPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');

      try {
        const listRes = await adminUserApi.list({ page: 1, limit: 1 });
        const users = extractList<Record<string, unknown>>(listRes);
        const id = String(users[0]?.id ?? '');

        if (!id) {
          return;
        }

        const detailRes = await adminUserApi.detail(id);
        const detail = extractData<Record<string, unknown> | null>(detailRes, null);

        setUserId(id);
        setUsername(String(detail?.username ?? ''));
        setEmail(String(detail?.email ?? ''));
        setRole(String(detail?.role ?? 'user'));
      } catch (err) {
        setError(getErrorMessage(err, '用户信息加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, []);

  return (
    <Card title="编辑用户" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="用户名">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} />
        </Form.Item>
        <Form.Item label="邮箱">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </Form.Item>
        <Form.Item label="角色">
          <RoleSelect value={role} onChange={setRole} />
        </Form.Item>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            if (!userId) {
              return;
            }

            setSaving(true);
            setError('');
            setSuccess('');

            try {
              await adminUserApi.update(userId, { username, email });
              await adminUserApi.updateRole(userId, { role });
              setSuccess('用户信息已更新');
            } catch (err) {
              setError(getErrorMessage(err, '用户更新失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          保存修改
        </Button>
      </Form>
    </Card>
  );
};

export default UserEditPage;
