import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, MousePointerClick, CreditCard, Loader2,
  TextCursorInput, ToggleLeft, CheckSquare, ClipboardList,
  Grid3X3, MessageSquare, Search, Plus, SlidersHorizontal,
} from 'lucide-react';
import { snippetApi } from '../../api';
import { Button, Empty, Loading } from '../../components/ui';
import { extractList, getErrorMessage } from '../../utils';
import { ComponentCard } from './components/ComponentCard';

const CATEGORY_PRESETS = [
  { key: 'buttons', label: '按钮', icon: MousePointerClick },
  { key: 'cards', label: '卡片', icon: CreditCard },
  { key: 'loaders', label: '加载器', icon: Loader2 },
  { key: 'inputs', label: '输入框', icon: TextCursorInput },
  { key: 'toggles', label: '开关', icon: ToggleLeft },
  { key: 'checkboxes', label: '复选框', icon: CheckSquare },
  { key: 'forms', label: '表单', icon: ClipboardList },
  { key: 'patterns', label: '图案', icon: Grid3X3 },
  { key: 'tooltips', label: '提示框', icon: MessageSquare },
];

const CATEGORY_ICON_MAP = new Map(CATEGORY_PRESETS.map((item) => [item.key, item.icon]));
const CATEGORY_LABEL_MAP = new Map(CATEGORY_PRESETS.map((item) => [item.key, item.label]));
const CATEGORY_KEY_SET = new Set(CATEGORY_PRESETS.map((item) => item.key));

const SORT_OPTIONS = [
  { key: 'newest', label: '最新发布' },
  { key: 'popular', label: '最受欢迎' },
  { key: 'views', label: '浏览最多' },
];

const FRAMEWORK_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'css', label: 'CSS' },
  { key: 'tailwind', label: 'Tailwind' },
  { key: 'react', label: 'React' },
];

interface ComponentItem {
  id: string;
  title: string;
  html: string;
  css: string;
  category: string;
  author: string;
  views: number;
  likes: number;
}

const extractAuthorName = (item: Record<string, unknown>): string => {
  if (typeof item.author === 'object' && item.author) {
    const a = item.author as Record<string, unknown>;
    return String(a.nickname ?? a.username ?? '匿名用户');
  }
  return '匿名用户';
};

const extractFiles = (item: Record<string, unknown>) => {
  const files = Array.isArray(item.files)
    ? (item.files as Array<{ filename?: string; language?: string; content?: string }>)
    : [];
  const htmlF = files.find((f) => f.language === 'html' || f.filename?.endsWith('.html'));
  const cssF = files.find((f) => f.language === 'css' || f.filename?.endsWith('.css'));
  return { html: String(htmlF?.content ?? ''), css: String(cssF?.content ?? '') };
};

const extractCategory = (item: Record<string, unknown>): string => {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  for (const t of tags) {
    const raw = typeof t === 'object' && t ? (t as Record<string, unknown>).name ?? (t as Record<string, unknown>).label : t;
    const name = String(raw ?? '').toLowerCase();
    if (CATEGORY_KEY_SET.has(name)) return name;
  }
  const fallback = String(item.language ?? item.category ?? '').trim().toLowerCase();
  return fallback || 'buttons';
};

const CodeListPage = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [framework, setFramework] = useState('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params: Record<string, unknown> = { page: 1, limit: 30, sort };
        if (category !== 'all') params.tag = category;
        if (keyword) params.keyword = keyword;
        if (framework !== 'all') params.framework = framework;

        const response = await snippetApi.list(params);
        const data = extractList<Record<string, unknown>>(response).map((item) => {
          const { html, css } = extractFiles(item);
          return {
            id: String(item.id ?? ''),
            title: String(item.title ?? '未命名组件'),
            html,
            css,
            category: extractCategory(item),
            author: extractAuthorName(item),
            views: Number(item.viewCount ?? item.views ?? 0),
            likes: Number(item.likeCount ?? item.likes ?? 0),
          };
        });
        setList(data.filter((d) => d.id));
      } catch (err) {
        setError(getErrorMessage(err, '组件列表加载失败'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [category, sort, framework, keyword]);

  const categoryOptions = useMemo(() => {
    const keys = Array.from(new Set(list.map((item) => String(item.category ?? '').trim().toLowerCase()).filter(Boolean)));
    const normalized = keys.map((key) => ({
      key,
      label: CATEGORY_LABEL_MAP.get(key) ?? key.toUpperCase(),
      icon: CATEGORY_ICON_MAP.get(key) ?? LayoutGrid,
    }));

    return [{ key: 'all', label: '全部', icon: LayoutGrid }, ...normalized];
  }, [list]);

  useEffect(() => {
    if (category !== 'all' && !categoryOptions.some((item) => item.key === category)) {
      setCategory('all');
    }
  }, [category, categoryOptions]);

  const filtered = category === 'all' ? list : list.filter((c) => c.category === category);

  return (
    <div className="cg-page">
      <div className="cg-header">
        <div>
          <h1 className="cg-title">组件广场</h1>
          <p className="cg-desc">浏览社区开源 UI 组件，使用 CSS 或 Tailwind 构建</p>
        </div>
        <Button onClick={() => navigate('/code/create')}>
          <Plus size={15} /> 发布组件
        </Button>
      </div>

      <div className="cg-body">
        <aside className="cg-sidebar">
          {categoryOptions.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                className={`cg-sidebar-item${category === cat.key ? ' cg-sidebar-item--active' : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                <Icon size={16} /> {cat.label}
              </button>
            );
          })}
        </aside>

        <div className="cg-main">
          <div className="cg-toolbar">
            <div className="cg-fw-tabs">
              {FRAMEWORK_FILTERS.map((fw) => (
                <button
                  key={fw.key}
                  type="button"
                  className={`cg-fw-tab${framework === fw.key ? ' cg-fw-tab--active' : ''}`}
                  onClick={() => setFramework(fw.key)}
                >
                  {fw.label}
                </button>
              ))}
            </div>
            <div className="cg-toolbar-right">
              <div className="cg-sort">
                <SlidersHorizontal size={14} />
                <select className="cg-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="cg-search">
                <Search size={14} />
                <input
                  className="cg-search-input"
                  placeholder="搜索组件..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading && <Loading text="加载组件中..." />}
          {error && <div className="cg-error">{error}</div>}
          {!loading && filtered.length === 0 && <Empty description="暂无组件，成为第一个发布者吧" />}

          <div className="cg-grid">
            {filtered.map((item) => (
              <Link key={item.id} to={`/code/${item.id}`} className="cg-grid-link">
                <ComponentCard
                  title={item.title}
                  html={item.html}
                  css={item.css}
                  author={item.author}
                  views={item.views}
                  likes={item.likes}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeListPage;
