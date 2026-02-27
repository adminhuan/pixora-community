import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '../../api';
import { Button, Card } from '../../components/ui';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    await authApi.resetPassword({ token, password });
    setSuccess(true);
  };

  return (
    <Card title="重置密码">
      <div style={{ display: 'grid', gap: 12 }}>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入新密码"
        />
        <Button onClick={onSubmit}>确认重置</Button>
        {success && <div style={{ color: 'var(--color-success)' }}>密码重置成功，请返回登录。</div>}
      </div>
    </Card>
  );
};

export default ResetPasswordPage;
