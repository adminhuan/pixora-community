import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Card } from '../../components/ui';
import { useAuth, useSiteSettings } from '../../hooks';
import { extractData, getErrorMessage, resolveSafeUrl } from '../../utils';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { siteName } = useSiteSettings();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ identifier: account, password, remember: true });
      const payload = extractData<Record<string, unknown> | null>(response, null);
      const user =
        payload && typeof payload.user === 'object' && payload.user
          ? (payload.user as Record<string, unknown>)
          : null;
      const accessToken = String(payload?.accessToken ?? '').trim();
      const userId = String(user?.id ?? '').trim();
      const username = String(user?.username ?? account).trim();
      const rawRole = String(user?.role ?? 'user').trim();
      const role = rawRole === 'admin' || rawRole === 'moderator' || rawRole === 'guest' ? rawRole : 'user';

      if (!userId || !accessToken) {
        throw new Error('登录响应缺少必要字段，请稍后重试');
      }

      login({
        user: {
          id: userId,
          username,
          role
        },
        accessToken
      });
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, '登录失败，请检查账号或密码'));
    } finally {
      setLoading(false);
    }
  };

  const onGithubLogin = async () => {
    setGithubLoading(true);
    setError('');

    try {
      const frontendCallbackUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      const response = await authApi.getGithubLoginRedirect(frontendCallbackUrl);
      const redirectUrl = String(response?.data?.redirectUrl ?? '').trim();
      const safeRedirectUrl = resolveSafeUrl(redirectUrl, {
        allowRelative: false,
        allowMailTo: false,
        allowTel: false,
        allowHash: false
      });

      if (!safeRedirectUrl) {
        throw new Error('暂未获取到可用的 GitHub 登录地址');
      }

      window.location.assign(safeRedirectUrl);
    } catch (err) {
      setError(getErrorMessage(err, 'GitHub 登录暂不可用'));
      setGithubLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up">
        <div className="auth-brand">
          <span className="apc-brand-mark">
            <Code2 size={18} />
          </span>
          <span className="auth-brand-title">{siteName}</span>
        </div>

        <Card padding={28}>
          <div className="auth-header">
            <h2 className="auth-title">欢迎回来</h2>
            <p className="auth-subtitle">登录你的账号继续</p>
          </div>

          <div className="auth-form">
            <input
              className="input"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              placeholder="邮箱 / 用户名"
            />
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="密码"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
            {error && <div role="alert" className="error-text">{error}</div>}
            <Button block disabled={loading || githubLoading} onClick={onSubmit}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="auth-divider">
              <span />
              <span>或</span>
              <span />
            </div>

            <Button block variant="outline" disabled={loading || githubLoading} onClick={onGithubLogin}>
              {githubLoading ? '正在跳转 GitHub...' : '使用 GitHub 登录'}
            </Button>

            <div className="auth-links">
              <Link to="/auth/forgot">忘记密码</Link>
              <Link to="/auth/register">注册新账号</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
