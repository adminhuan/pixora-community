import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Search, ExternalLink, Heart } from 'lucide-react';
import { snippetApi } from '../../api';
import { Loading, Empty, Pagination } from '../../components/ui';
import { ComponentPreview } from '../../components/shared/ComponentPreview';
import { extractData, extractList, extractPagination } from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useDebounce, useAuth } from '../../hooks';
import type { Snippet } from '../../types/common';
import clsx from 'classnames';

const CATEGORY_LABEL_MAP: Record<string, string> = {
  buttons: '按钮',
  cards: '卡片',
  loaders: '加载器',
  inputs: '输入框',
  toggles: '开关',
  checkboxes: '复选框',
  forms: '表单',
  patterns: '图案',
  alerts: '提示框',
  modals: '弹窗',
  navbars: '导航栏',
  footers: '页脚',
  other: '其他',
};

const resolveCategoryLabel = (categoryKey: string): string => {
  if (CATEGORY_LABEL_MAP[categoryKey]) {
    return CATEGORY_LABEL_MAP[categoryKey];
  }

  if (/[\u4e00-\u9fa5]/.test(categoryKey)) {
    return categoryKey;
  }

  return categoryKey.toUpperCase();
};

const FRAMEWORKS = [
  { key: '', label: 'All' },
  { key: 'css', label: 'CSS' },
  { key: 'tailwind', label: 'Tailwind' },
  { key: 'react', label: 'React' },
];

const SORT_OPTIONS = [
  { key: '', label: '最新' },
  { key: 'popular', label: '最热' },
  { key: 'views', label: '最多浏览' },
];

const ExplorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [categoryOptions, setCategoryOptions] = useState<Array<{ key: string; label: string }>>([{ key: '', label: '全部' }]);

  const category = searchParams.get('category') ?? '';
  const framework = searchParams.get('framework') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const debouncedKeyword = useDebounce(keyword, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 36,
        type: 'component',
        visibility: 'public',
      };
      if (category) params.category = category;
      if (framework) params.framework = framework;
      if (sort) params.sort = sort;
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (searchParams.get('isFeatured')) params.isFeatured = 'true';
      if (searchParams.get('isRecommended')) params.isRecommended = 'true';

      const res = await snippetApi.list(params);
      setSnippets(extractList<Snippet>(res));
      const pag = extractPagination(res);
      if (pag) setTotal(pag.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, category, framework, sort, debouncedKeyword, searchParams]);

  useEffect(() => {
    const loadCategoryOptions = async () => {
      try {
        const response = await snippetApi.list({
          page: 1,
          limit: 300,
          type: 'component',
          visibility: 'public',
          includeFiles: 'false',
        });

        const list = extractList<Snippet>(response);
        const seen = new Set<string>();
        const dynamicItems: Array<{ key: string; label: string }> = [];

        list.forEach((item) => {
          const key = String(item.category ?? '').trim();
          if (!key || seen.has(key)) {
            return;
          }

          seen.add(key);
          dynamicItems.push({
            key,
            label: resolveCategoryLabel(key),
          });
        });

        setCategoryOptions([{ key: '', label: '全部' }, ...dynamicItems]);
      } catch {
        setCategoryOptions([{ key: '', label: '全部' }]);
      }
    };

    void loadCategoryOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!category) {
      return;
    }

    const exists = categoryOptions.some((item) => item.key === category);
    if (exists) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('page');
    setSearchParams(next);
    setPage(1);
  }, [category, categoryOptions, searchParams, setSearchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
    setPage(1);
  };

  const handleLike = async (id: string) => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    try {
      const res = await snippetApi.like(id);
      const result = extractData<{ liked: boolean }>(res, { liked: true });
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? {
          ...s,
          isLiked: result.liked,
          likeCount: s.likeCount + (result.liked ? 1 : -1),
        } : s)),
      );
    } catch { /* ignore */ }
  };

  return (
    <div className="cp-explore">
      <aside className="cp-explore-sidebar">
        <h3 className="cp-sidebar-title">分类</h3>
        <ul className="cp-sidebar-list">
          {categoryOptions.map((cat) => (
            <li key={cat.key}>
              <button
                type="button"
                className={clsx('cp-sidebar-item', category === cat.key && 'active')}
                onClick={() => updateFilter('category', cat.key)}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="cp-explore-main">
        <div className="cp-explore-toolbar">
          <div className="cp-filter-row">
            <div className="cp-framework-tabs">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.key}
                  type="button"
                  className={clsx('cp-fw-tab', framework === fw.key && 'active')}
                  onClick={() => updateFilter('framework', fw.key)}
                >
                  {fw.label}
                </button>
              ))}
            </div>
            <div className="cp-sort-tabs">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={clsx('cp-sort-tab', sort === s.key && 'active')}
                  onClick={() => updateFilter('sort', s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cp-explore-search">
            <Search size={14} />
            <input
              className="cp-explore-search-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索组件名称..."
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : snippets.length === 0 ? (
          <Empty description="没有找到匹配的组件" />
        ) : (
          <>
            <div className="cp-component-grid">
              {snippets.map((item) => (
                <div key={item.id} className="cp-component-card">
                  <div className="cp-component-preview">
                    <ComponentPreview files={item.files} height={220} framework={item.framework} />
                    <button
                      type="button"
                      className="cp-preview-overlay"
                      onClick={() => navigate(`/component/${item.id}`)}
                      aria-label="查看详情"
                    >
                      <ExternalLink size={18} />
                      <span>查看详情</span>
                    </button>
                  </div>
                  <div className="cp-component-info">
                    <h3
                      className="cp-component-name"
                      onClick={() => navigate(`/component/${item.id}`)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/component/${item.id}`)}
                    >
                      {item.title}
                    </h3>
                    <div className="cp-component-meta">
                      <span className="cp-meta-author" onClick={() => navigate(`/component/${item.id}`)}>{item.author.username}</span>
                      <span>{formatNumber(item.viewCount)} views</span>
                      <button type="button" className={`cp-like-btn${item.isLiked ? ' active' : ''}`} onClick={() => handleLike(item.id)}>
                        <Heart size={13} fill={item.isLiked ? 'currentColor' : 'none'} /> {formatNumber(item.likeCount)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              pageSize={36}
              total={total}
              onChange={(p) => {
                setPage(p);
                const next = new URLSearchParams(searchParams);
                next.set('page', String(p));
                setSearchParams(next);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
