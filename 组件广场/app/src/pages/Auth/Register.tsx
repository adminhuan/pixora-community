import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Card } from '../../components/ui';
import { useSiteSettings } from '../../hooks';
import {
  extractData,
  getErrorMessage,
  resolveSafeRoutePath,
  resolveSafeUrl,
  savePostLoginRedirect
} from '../../utils';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveSafeRoutePath(searchParams.get('redirect') || '/', '/');
  const { siteName } = useSiteSettings();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    emailCode: '',
    agree: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaCode('');

    try {
      const response = await authApi.getCaptcha();
      const data = extractData<{ captchaId: string; svg: string } | null>(response, null);
      if (data) {
        setCaptchaId(data.captchaId);
        setCaptchaSvg(data.svg);
      }
    } catch {
      setError('获取图形验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCaptcha();
  }, [fetchCaptcha]);

  const onSendEmailCode = async () => {
    if (!form.email) {
      setError('请先输入邮箱');
      return;
    }
    if (!captchaCode) {
      setError('请输入图形验证码');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      await authApi.sendEmailCode({ email: form.email, captchaId, captchaCode });
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err, '发送验证码失败'));
      void fetchCaptcha();
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmit = async () => {
    if (!form.agree) {
      setError('请先同意用户协议');
      return;
    }
    if (!form.emailCode) {
      setError('请输入邮箱验证码');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
        emailCode: form.emailCode,
      });

      const next = `/auth/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, '注册失败，请稍后重试'));
    } finally {
      setSubmitting(false);
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
        allowHash: false,
      });

      if (!safeRedirectUrl) {
        throw new Error('暂未获取到可用的 GitHub 登录地址');
      }

      window.location.assign(safeRedirectUrl);
    } catch (err) {
      setError(getErrorMessage(err, 'GitHub 登录暂不可用，请稍后重试'));
      setGithubLoading(false);
    }
  };

  const anyLoading = submitting || githubLoading;
  const captchaImageSrc = captchaSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(captchaSvg)}` : '';

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
            <h2 className="cp-auth-title">创建账号</h2>
            <p className="cp-auth-subtitle">加入创作者社区</p>
          </div>
          <div className="cp-auth-form">
            <input
              className="cp-input"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="用户名"
            />
            <input
              className="cp-input"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="邮箱"
            />

            <div className="cp-auth-inline-row">
              {captchaImageSrc ? (
                <img
                  className="cp-auth-captcha-image"
                  onClick={() => void fetchCaptcha()}
                  src={captchaImageSrc}
                  alt="图形验证码"
                  title="点击刷新验证码"
                />
              ) : (
                <button
                  type="button"
                  className="cp-auth-captcha-trigger"
                  onClick={() => void fetchCaptcha()}
                >
                  {captchaLoading ? '加载中...' : '点击获取'}
                </button>
              )}
              <input
                className="cp-input"
                value={captchaCode}
                onChange={(e) => setCaptchaCode(e.target.value)}
                placeholder="图形验证码"
              />
            </div>

            <div className="cp-auth-inline-row">
              <input
                className="cp-input"
                value={form.emailCode}
                onChange={(e) => setForm((prev) => ({ ...prev, emailCode: e.target.value }))}
                placeholder="邮箱验证码"
              />
              <Button
                variant="outline"
                className="cp-auth-code-btn"
                disabled={countdown > 0 || sendingCode || !form.email || !captchaCode}
                onClick={onSendEmailCode}
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>

            <input
              className="cp-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="密码"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
            <label className="cp-auth-checkbox">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => setForm((prev) => ({ ...prev, agree: e.target.checked }))}
              />
              我已阅读并同意用户协议
            </label>
            {error && <div className="cp-error-text">{error}</div>}
            <Button block disabled={anyLoading} onClick={onSubmit}>
              {submitting ? '创建中...' : '创建账号'}
            </Button>
            <div className="cp-auth-divider">
              <span />
              <span>或</span>
              <span />
            </div>
            <Button block variant="outline" disabled={anyLoading} onClick={onGithubLogin}>
              {githubLoading ? '正在跳转 GitHub...' : '使用 GitHub 登录 / 注册'}
            </Button>
            <div className="cp-auth-links">
              <Link to={`/auth/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
                已有账号？去登录
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
