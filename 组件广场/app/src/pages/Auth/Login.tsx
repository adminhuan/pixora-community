import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Card } from '../../components/ui';
import { useAuth, useSiteSettings } from '../../hooks';
import { extractData, getErrorMessage, resolveSafeRoutePath, resolveSafeUrl, savePostLoginRedirect } from '../../utils';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveSafeRoutePath(searchParams.get('redirect') || '/', '/');
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
      const username = String((user?.username ?? account) || '开发者').trim();
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
      navigate(redirect, { replace: true });
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
      savePostLoginRedirect(redirect);
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
        throw new Error('GitHub 登录地址无效');
      }

      window.location.assign(safeRedirectUrl);
    } catch (err) {
      setError(getErrorMessage(err, 'GitHub 登录暂不可用'));
      setGithubLoading(false);
    }
  };

  const anyLoading = loading || githubLoading;

  return (
    <div className="cp-auth-page">
      <div className="cp-auth-container">
        <div className="cp-auth-brand">
          <span className="cp-brand-mark">
            <Code2 size={18} />
          </span>
          <span className="cp-auth-brand-title">{siteName}</span>
        </div>
        <Card padding={28}>
          <div className="cp-auth-header">
            <h2 className="cp-auth-title">欢迎回来</h2>
            <p className="cp-auth-subtitle">登录你的账号继续</p>
          </div>
          <div className="cp-auth-form">
            <input
              className="cp-input"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="邮箱 / 用户名"
            />
            <input
              className="cp-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
            {error && <div className="cp-error-text">{error}</div>}
            <Button block disabled={anyLoading} onClick={onSubmit}>
              {loading ? '登录中...' : '登录'}
            </Button>
            <div className="cp-auth-divider">
              <span />
              <span>或</span>
              <span />
            </div>
            <Button block variant="outline" disabled={anyLoading} onClick={onGithubLogin}>
              {githubLoading ? '正在跳转 GitHub...' : '使用 GitHub 登录'}
            </Button>
            <div className="cp-auth-links">
              <a href="https://pixora.vip/auth/forgot">忘记密码</a>
              <Link to={`/auth/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
                注册新账号
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
