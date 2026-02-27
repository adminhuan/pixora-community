import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, TrendingUp, ExternalLink, Grid3X3, ToggleLeft, Type, MousePointerClick, Loader, FormInput, MessageSquare, PanelTop, Heart } from 'lucide-react';
import { snippetApi } from '../../api';
import { Button, Loading, Empty } from '../../components/ui';
import { ComponentPreview } from '../../components/shared/ComponentPreview';
import { extractData, extractList } from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks';
import type { Snippet } from '../../types/common';

const CATEGORY_PRESETS = [
  { key: 'buttons', label: '按钮', icon: MousePointerClick },
  { key: 'cards', label: '卡片', icon: Grid3X3 },
  { key: 'loaders', label: '加载器', icon: Loader },
  { key: 'inputs', label: '输入框', icon: Type },
  { key: 'toggles', label: '开关', icon: ToggleLeft },
  { key: 'forms', label: '表单', icon: FormInput },
  { key: 'alerts', label: '提示框', icon: MessageSquare },
  { key: 'navbars', label: '导航栏', icon: PanelTop },
];
const CATEGORY_ICON_MAP = new Map(CATEGORY_PRESETS.map((item) => [item.key, item.icon]));
const CATEGORY_LABEL_MAP = new Map(CATEGORY_PRESETS.map((item) => [item.key, item.label]));

const resolveCategoryLabel = (categoryKey: string): string => {
  if (CATEGORY_LABEL_MAP.has(categoryKey)) {
    return String(CATEGORY_LABEL_MAP.get(categoryKey));
  }

  if (/[\u4e00-\u9fa5]/.test(categoryKey)) {
    return categoryKey;
  }

  return categoryKey.toUpperCase();
};

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState<Snippet[]>([]);
  const [popular, setPopular] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredRes, popularRes] = await Promise.all([
          snippetApi.list({ type: 'component', isFeatured: 'true', limit: 6, visibility: 'public' }),
          snippetApi.list({ type: 'component', sort: 'popular', limit: 12, visibility: 'public' }),
        ]);
        setFeatured(extractList<Snippet>(featuredRes));
        setPopular(extractList<Snippet>(popularRes));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categoryItems = useMemo(() => {
    const source = [...featured, ...popular];
    const seen = new Set<string>();
    const items: Array<{ key: string; label: string; icon: typeof Grid3X3 }> = [];

    source.forEach((snippet) => {
      const key = String(snippet.category ?? '').trim();
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      items.push({
        key,
        label: resolveCategoryLabel(key),
        icon: CATEGORY_ICON_MAP.get(key) ?? Grid3X3,
      });
    });

    return items.slice(0, 8);
  }, [featured, popular]);

  const handleLike = async (id: string, list: 'featured' | 'popular') => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const res = await snippetApi.like(id);
      const result = extractData<{ liked: boolean }>(res, { liked: true });
      const updater = (prev: Snippet[]) =>
        prev.map((s) => (s.id === id ? {
          ...s,
          isLiked: result.liked,
          likeCount: s.likeCount + (result.liked ? 1 : -1),
        } : s));
      if (list === 'featured') setFeatured(updater);
      else setPopular(updater);
    } catch { /* ignore */ }
  };

  if (loading) return <Loading />;

  return (
    <div className="cp-home">
      <section className="cp-hero">
        <div className="cp-hero-content">
          <h1 className="cp-hero-title">
            发现、创建、分享<br />
            <span className="cp-hero-highlight">精美 UI 组件</span>
          </h1>
          <p className="cp-hero-desc">
            数百个开源 CSS 组件，即复制即用。从按钮到加载器，让你的项目更出色。
          </p>
          <div className="cp-hero-actions">
            <Button size="lg" onClick={() => navigate('/explore')}>
              浏览组件 <ArrowRight size={16} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/create')}>
              发布组件
            </Button>
          </div>
        </div>
      </section>

      <section className="cp-section">
        <div className="cp-section-header">
          <h2 className="cp-section-title">
            <Grid3X3 size={18} /> 分类浏览
          </h2>
        </div>
        {categoryItems.length > 0 ? (
          <div className="cp-category-grid">
            {categoryItems.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.key} to={`/explore?category=${cat.key}`} className="cp-category-card">
                  <Icon size={24} className="cp-category-icon" />
                  <span className="cp-category-label">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty description="暂无可用分类" />
        )}
      </section>

      {featured.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-header">
            <h2 className="cp-section-title">
              精选组件
            </h2>
            <Link to="/explore?isFeatured=true" className="cp-section-more">
              查看更多 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="cp-component-grid">
            {featured.map((item) => (
              <div key={item.id} className="cp-component-card">
                <div className="cp-component-preview">
                  <ComponentPreview files={item.files} height={220} framework={item.framework} />
                  <button type="button" className="cp-preview-overlay" onClick={() => navigate(`/component/${item.id}`)} aria-label="查看详情">
                    <ExternalLink size={14} /> <span>详情</span>
                  </button>
                </div>
                <div className="cp-component-info">
                  <h3 className="cp-component-name" onClick={() => navigate(`/component/${item.id}`)} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/component/${item.id}`)}>{item.title}</h3>
                  <div className="cp-component-meta">
                    <span className="cp-meta-author" onClick={() => navigate(`/component/${item.id}`)}>{item.author.username}</span>
                    <button type="button" className={`cp-like-btn${item.isLiked ? ' active' : ''}`} onClick={() => handleLike(item.id, 'featured')}>
                      <Heart size={13} fill={item.isLiked ? 'currentColor' : 'none'} /> {formatNumber(item.likeCount)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="cp-section">
        <div className="cp-section-header">
          <h2 className="cp-section-title">
            <TrendingUp size={18} /> 最受欢迎
          </h2>
          <Link to="/explore?sort=popular" className="cp-section-more">
            查看更多 <ArrowRight size={14} />
          </Link>
        </div>
        {popular.length > 0 ? (
          <div className="cp-component-grid">
            {popular.map((item) => (
              <div key={item.id} className="cp-component-card">
                <div className="cp-component-preview">
                  <ComponentPreview files={item.files} height={220} framework={item.framework} />
                  <button type="button" className="cp-preview-overlay" onClick={() => navigate(`/component/${item.id}`)} aria-label="查看详情">
                    <ExternalLink size={14} /> <span>详情</span>
                  </button>
                </div>
                <div className="cp-component-info">
                  <h3 className="cp-component-name" onClick={() => navigate(`/component/${item.id}`)} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/component/${item.id}`)}>{item.title}</h3>
                  <div className="cp-component-meta">
                    <span className="cp-meta-author" onClick={() => navigate(`/component/${item.id}`)}>{item.author.username}</span>
                    <button type="button" className={`cp-like-btn${item.isLiked ? ' active' : ''}`} onClick={() => handleLike(item.id, 'popular')}>
                      <Heart size={13} fill={item.isLiked ? 'currentColor' : 'none'} /> {formatNumber(item.likeCount)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无组件，快来发布第一个吧" />
        )}
      </section>
    </div>
  );
};

export default HomePage;
