import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api';
import { Loading } from '../../components/ui';
import { useAuth } from '../../hooks';
import { extractData, getErrorMessage } from '../../utils/api';
import { resolveSafeRoutePath, takePostLoginRedirect } from '../../utils';

type AuthRole = 'user' | 'admin' | 'moderator';

const normalizeRole = (role: unknown): AuthRole => {
  const value = String(role ?? '').trim();
  if (value === 'admin' || value === 'moderator') {
    return value;
  }
  return 'user';
};

const readHashParams = (): URLSearchParams => {
  const rawHash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(rawHash);
};

const clearSensitiveAuthParams = () => {
  if (!window.location.search && !window.location.hash) {
    return;
  }
  window.history.replaceState(null, document.title, window.location.pathname);
};

const CallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [redirectTarget] = useState(() => {
    const queryRedirect = resolveSafeRoutePath(searchParams.get('redirect') || '', '');
    if (queryRedirect && !queryRedirect.startsWith('/auth/')) {
      return queryRedirect;
    }
    return takePostLoginRedirect('/');
  });
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const exchange = async () => {
      const hashParams = readHashParams();
      const token =
        searchParams.get('token') ||
        searchParams.get('accessToken') ||
        hashParams.get('token') ||
        hashParams.get('accessToken');

      clearSensitiveAuthParams();

      if (!token) {
        setError('缺少认证参数，请重新从社区进入组件广场');
        return;
      }

      const completeLogin = async (accessToken: string) => {
        const res = await authApi.exchangeToken(accessToken);
        const data = extractData<{ user: { id: string; username: string; role: string }; valid: boolean }>(
          res,
          null as never
        );

        if (!data?.valid || !data.user) {
          return false;
        }

        login({
          user: {
            id: data.user.id,
            username: data.user.username,
            role: normalizeRole(data.user.role)
          },
          accessToken
        });

        navigate(redirectTarget, { replace: true });
        return true;
      };

      try {
        const exchanged = await completeLogin(token);
        if (exchanged) {
          return;
        }

        const refreshRes = await authApi.refreshToken();
        const refreshData = extractData<{ accessToken?: string }>(refreshRes, {});
        const nextToken = String(refreshData.accessToken ?? '').trim();

        if (nextToken && (await completeLogin(nextToken))) {
          return;
        }

        setError('认证失败，正在跳转首页...');
      } catch (err) {
        const message = getErrorMessage(err, '认证失败');
        setError(`${message}，正在跳转首页...`);
      }
    };

    void exchange();
  }, [searchParams, login, navigate, redirectTarget]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectTarget, { replace: true });
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [error, navigate, redirectTarget]);

  if (error) {
    return (
      <div className="cp-auth-page">
        <div className="cp-auth-container" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--cp-text-secondary)', marginBottom: 16 }}>{error}</div>
          <div style={{ color: 'var(--cp-text-muted)', fontSize: 14, marginBottom: 12 }}>
            {countdown} 秒后自动跳转首页，你也可以直接
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href={redirectTarget} style={{ color: 'var(--cp-accent)' }}>
              进入首页
            </a>
            <a href="/auth/login" style={{ color: 'var(--cp-accent)' }}>
              前往登录
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-auth-page">
      <Loading text="正在验证身份..." />
    </div>
  );
};

export default CallbackPage;
