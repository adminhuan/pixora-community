import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Blocks, Moon, Plus, Search, Sun } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/ui';
import { useAuth, useClickOutside, useDarkMode, useSiteSettings } from '../hooks';
import { resolveSafeImageSrc, resolveSafeUrl } from '../utils';

const COMMUNITY_RAW_URL = String(import.meta.env.VITE_COMMUNITY_URL ?? 'https://pixora.vip').trim();
const COMMUNITY_URL = resolveSafeUrl(COMMUNITY_RAW_URL, {
  allowRelative: false,
  allowMailTo: false,
  allowTel: false,
  allowHash: false
});
const COMMUNITY_ENABLED = COMMUNITY_URL.length > 0;

const navItems = [
  { to: '/', label: '首页' },
  { to: '/explore', label: '浏览组件' }
];

export const Navbar = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated, user, logout } = useAuth();
  const { mode, toggleMode } = useDarkMode();
  const { siteName, logo } = useSiteSettings();
  const safeAvatar = resolveSafeImageSrc(String(user?.avatar ?? ''), { allowDataImage: true, allowRelative: true });

  useClickOutside(menuRef, () => setMenuOpen(false));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/explore?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <header className="cp-navbar">
      <div className="cp-navbar-inner">
        <Link to="/" className="cp-brand" aria-label="返回首页">
          <span className="cp-brand-mark">
            {logo ? (
              <img src={logo} alt={siteName} style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }} />
            ) : (
              <Blocks size={16} />
            )}
          </span>
          <span className="cp-brand-text">{siteName}</span>
        </Link>

        <nav className="cp-nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `cp-nav-link${isActive ? ' active' : ''}`}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
          {COMMUNITY_ENABLED ? (
            <a href={COMMUNITY_URL} className="cp-nav-link" target="_blank" rel="noopener noreferrer">
              社区论坛
            </a>
          ) : (
            <span className="cp-nav-link" style={{ opacity: 0.6, cursor: 'not-allowed' }} title="请配置有效 VITE_COMMUNITY_URL">
              社区论坛
            </span>
          )}
        </nav>

        <form className="cp-search-form" onSubmit={handleSearch}>
          <Search size={14} className="cp-search-icon" />
          <input
            className="cp-search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索组件..."
          />
        </form>

        <div className="cp-nav-right">
          <button
            type="button"
            className="cp-theme-toggle"
            onClick={toggleMode}
            aria-label={mode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={mode === 'dark' ? '浅色模式' : '深色模式'}
          >
            {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {isAuthenticated && (
            <Button size="sm" onClick={() => navigate('/create')}>
              <Plus size={14} /> 发布组件
            </Button>
          )}

          {isAuthenticated ? (
            <div className="cp-user-menu" ref={menuRef}>
              <button
                type="button"
                className="cp-avatar-btn"
                onClick={() => setMenuOpen((p) => !p)}
              >
                {safeAvatar ? (
                  <img src={safeAvatar} alt="" className="cp-avatar-img" />
                ) : (
                  <span className="cp-avatar-placeholder">
                    {(user?.username ?? 'U')[0].toUpperCase()}
                  </span>
                )}
              </button>
              {menuOpen && (
                <div className="cp-user-dropdown">
                  <button type="button" onClick={() => { setMenuOpen(false); navigate(`/user/${user?.id}`); }}>
                    我的组件
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="cp-auth-btns">
              <Button size="sm" onClick={() => navigate('/auth/login')}>登录</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/auth/register')}>注册</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
