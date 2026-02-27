import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuth } from '../../hooks';
import { extractData, getErrorMessage } from '../../utils';

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

const OAuthCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const finalize = async () => {
      const hashParams = readHashParams();
      const accessToken = params.get('accessToken') || hashParams.get('accessToken') || hashParams.get('token');

      clearSensitiveAuthParams();

      if (!accessToken) {
        navigate('/auth/login', { replace: true });
        return;
      }

      try {
        const exchangeResponse = await authApi.exchangeToken(accessToken);
        const exchangeData = extractData<Record<string, unknown> | null>(exchangeResponse, null);
        const exchangeUser =
          exchangeData && typeof exchangeData.user === 'object' && exchangeData.user
            ? (exchangeData.user as Record<string, unknown>)
            : null;

        const id = String(exchangeUser?.id ?? params.get('userId') ?? '').trim();
        const username = String(exchangeUser?.username ?? params.get('username') ?? 'OAuth用户').trim();
        const rawRole = String(exchangeUser?.role ?? params.get('role') ?? 'user').trim();
        const role = rawRole === 'admin' || rawRole === 'moderator' || rawRole === 'guest' ? rawRole : 'user';

        if (!id) {
          throw new Error('OAuth 登录信息不完整，请重新登录');
        }

        login({
          user: {
            id,
            username,
            role
          },
          accessToken
        });

        if (!cancelled) {
          navigate('/', { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'OAuth 登录失败，请重试'));
          setTimeout(() => navigate('/auth/login', { replace: true }), 1200);
        }
      }
    };

    void finalize();

    return () => {
      cancelled = true;
    };
  }, [login, navigate, params]);

  if (error) {
    return <div role="alert">{error}</div>;
  }

  return <div>登录处理中...</div>;
};

export default OAuthCallbackPage;
