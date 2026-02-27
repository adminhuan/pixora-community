import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Plus, Sun, Moon, Code2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, Dropdown } from '../components/ui';
import { SearchBar } from '../components/Search/SearchBar';
import { messageApi, notificationApi } from '../api';
import { useAuth, useSiteSettings } from '../hooks';
import { useDarkMode } from '../hooks/useDarkMode';
import { useClickOutside } from '../hooks/useClickOutside';
import { connectNotificationSocket, disconnectNotificationSocket } from '../services/websocket';
import { extractData } from '../utils';
import { openSafeUrlInNewTab, resolveSafeUrl } from '../utils';

const COMPONENT_PLAZA_RAW_URL = String(import.meta.env.VITE_COMPONENT_PLAZA_URL ?? '').trim();
const COMPONENT_PLAZA_URL = resolveSafeUrl(COMPONENT_PLAZA_RAW_URL, {
  allowRelative: false,
  allowMailTo: false,
  allowTel: false,
  allowHash: false
});
const COMPONENT_PLAZA_ENABLED = COMPONENT_PLAZA_URL.length > 0;

const navItems = [
  { to: '/', label: '首页' },
  { to: '/forum', label: '论坛' },
  { to: '/qa', label: '问答' },
  { to: '/projects', label: '项目展示' },
  { to: '/blog', label: '博客' }
];

const buildComponentPlazaAuthUrl = (accessToken?: string | null): string => {
  const normalizedBase = COMPONENT_PLAZA_URL.replace(/\/+$/, '');
  if (!normalizedBase) {
    return '';
  }

  if (!accessToken) {
    return normalizedBase;
  }

  const hash = new URLSearchParams();
  hash.set('token', accessToken);
  return `${normalizedBase}/auth/callback#${hash.toString()}`;
};

export const Navbar = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const publishRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated, user, logout, accessToken } = useAuth();
  const { siteName, logo } = useSiteSettings();
  const { mode, toggleMode } = useDarkMode();

  const publishItems = [
    { key: 'forum', label: '发布论坛帖子', to: '/forum/create' },
    { key: 'qa', label: '发布问答问题', to: '/qa/ask' },
    {
      key: 'code',
      label: COMPONENT_PLAZA_ENABLED ? '发布代码组件' : '发布代码组件（未配置）',
      to: COMPONENT_PLAZA_ENABLED ? `${COMPONENT_PLAZA_URL}/create` : '',
      external: true,
      disabled: !COMPONENT_PLAZA_ENABLED
    },
    { key: 'projects', label: '发布项目展示', to: '/projects/create' },
    { key: 'blog', label: '发布博客文章', to: '/blog/write' }
  ];

  const componentPlazaHref = COMPONENT_PLAZA_ENABLED
    ? buildComponentPlazaAuthUrl(isAuthenticated ? accessToken : null)
    : '';

  useClickOutside(publishRef, () => {
    setPublishOpen(false);
  });

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setMessageUnreadCount(0);
      setNotificationUnreadCount(0);
      disconnectNotificationSocket();
      return;
    }

    const loadUnreadCounts = async () => {
      try {
        const [messageResponse, notificationResponse] = await Promise.all([
          messageApi.unreadCount(),
          notificationApi.unreadCount(),
        ]);

        const messagePayload = extractData<Record<string, unknown>>(messageResponse, { count: 0 });
        setMessageUnreadCount(Math.max(0, Number(messagePayload.count ?? 0) || 0));

        const notificationPayload = extractData<Record<string, unknown>>(notificationResponse, { count: 0 });
        setNotificationUnreadCount(Math.max(0, Number(notificationPayload.count ?? 0) || 0));
      } catch {
        setMessageUnreadCount(0);
        setNotificationUnreadCount(0);
      }
    };

    const socket = connectNotificationSocket(accessToken);

    const handleConnect = () => {
      void loadUnreadCounts();
    };

    const handlePrivateMessageCount = (payload: { count?: number }) => {
      setMessageUnreadCount(Math.max(0, Number(payload.count ?? 0) || 0));
    };

    const handlePrivateMessage = () => {
      setMessageUnreadCount((prev) => prev + 1);
    };

    const handleNotificationCount = (payload: { count?: number }) => {
      setNotificationUnreadCount(Math.max(0, Number(payload.count ?? 0) || 0));
    };

    const handleNotification = () => {
      setNotificationUnreadCount((prev) => prev + 1);
    };

    socket.on('connect', handleConnect);
    socket.on('private-message:count', handlePrivateMessageCount);
    socket.on('private-message:new', handlePrivateMessage);
    socket.on('notification:count', handleNotificationCount);
    socket.on('notification:new', handleNotification);

    void loadUnreadCounts();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('private-message:count', handlePrivateMessageCount);
      socket.off('private-message:new', handlePrivateMessage);
      socket.off('notification:count', handleNotificationCount);
      socket.off('notification:new', handleNotification);
    };
  }, [accessToken, isAuthenticated]);

  const handleSearch = () => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handlePublishNavigate = (path: string, external?: boolean) => {
    setPublishOpen(false);

    if (!path) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (external) {
      openSafeUrlInNewTab(path);
      return;
    }

    navigate(path);
  };

  return (
    <header className="apc-navbar">
      <div className="apc-navbar-inner">
        <Link to="/" className="apc-brand" aria-label="返回首页">
          <span className="apc-brand-mark">
            {logo ? (
              <img src={logo} alt={siteName} style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }} />
            ) : (
              <Code2 size={15} />
            )}
          </span>
          <span className="apc-brand-text">{siteName}</span>
        </Link>

        <div className="apc-nav-main">
          <nav className="apc-nav-links" aria-label="主导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `apc-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
            {COMPONENT_PLAZA_ENABLED ? (
              <a href={componentPlazaHref} className="apc-nav-link" target="_blank" rel="noopener noreferrer">
                组件广场
              </a>
            ) : (
              <span
                className="apc-nav-link"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                title="请配置 VITE_COMPONENT_PLAZA_URL"
              >
                组件广场
              </span>
            )}
          </nav>

          <SearchBar
            value={keyword}
            onChange={setKeyword}
            onSearch={handleSearch}
            placeholder="搜索帖子、问答、代码、项目"
          />
        </div>

        <div className="apc-nav-right">
          <button type="button" aria-label="切换主题" onClick={toggleMode} className="apc-icon-btn">
            {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <Link
            to={isAuthenticated ? '/messages' : '/auth/login'}
            aria-label="私信"
            className="apc-icon-btn apc-icon-btn--badge"
          >
            <Mail size={17} />
            {isAuthenticated && messageUnreadCount > 0 ? (
              <span className="apc-icon-badge">{messageUnreadCount > 99 ? '99+' : messageUnreadCount}</span>
            ) : null}
          </Link>

          <Link
            to={isAuthenticated ? '/notifications' : '/auth/login'}
            aria-label="通知"
            className="apc-icon-btn apc-icon-btn--badge"
          >
            <Bell size={17} />
            {isAuthenticated && notificationUnreadCount > 0 ? (
              <span className="apc-icon-badge">{notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}</span>
            ) : null}
          </Link>

          <div className="apc-publish-wrap" ref={publishRef}>
            <button
              type="button"
              className="apc-publish-btn"
              onClick={() => setPublishOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={publishOpen}
            >
              <Plus size={14} /> 发布
            </button>

            {publishOpen && (
              <div className="apc-publish-menu" role="menu" aria-label="发布入口">
                {publishItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    className="apc-publish-item"
                    disabled={Boolean(item.disabled)}
                    onClick={() => handlePublishNavigate(item.to, item.external)}
                  >
                    <span>{item.label}</span>
                    <span className="apc-publish-item-tip">前往</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <Dropdown
              items={[
                { key: 'profile', label: '个人中心' },
                { key: 'settings', label: '设置' },
                { key: 'logout', label: '退出' }
              ]}
              onSelect={(key) => {
                if (key === 'profile') {
                  navigate(`/user/${user?.id ?? 'me'}`);
                }

                if (key === 'settings') {
                  navigate('/settings');
                }

                if (key === 'logout') {
                  logout();
                  navigate('/auth/login');
                }
              }}
              placeholder={user?.username ?? '账户'}
            />
          ) : (
            <div className="button-row">
              <Button variant="outline" onClick={() => navigate('/auth/login')}>
                登录
              </Button>
              <Button onClick={() => navigate('/auth/register')}>注册</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
