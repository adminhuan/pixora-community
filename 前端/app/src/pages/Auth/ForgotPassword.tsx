import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api';
import { Button, Card } from '../../components/ui';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    await authApi.forgotPassword({ email });
    setSubmitted(true);
  };

  return (
    <Card title="找回密码">
      <div style={{ display: 'grid', gap: 12 }}>
        <input
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="请输入注册邮箱"
        />
        <Button onClick={onSubmit}>发送重置链接</Button>
        {submitted && <div style={{ color: 'var(--color-success)', fontSize: 13 }}>邮件已发送，请检查邮箱。</div>}
        <div style={{ fontSize: 13 }}>
          <Link to="/auth/login">返回登录</Link>
        </div>
      </div>
    </Card>
  );
};

export default ForgotPasswordPage;
