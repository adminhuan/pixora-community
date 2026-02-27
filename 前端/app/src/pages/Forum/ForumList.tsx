import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { categoryApi, postApi, tagApi } from '../../api';
import { Button, Card, Empty, Loading } from '../../components/ui';
import type { ContentItem } from '../../types/common';
import { extractData, extractList, getErrorMessage } from '../../utils';
import { CategoryFilter } from './components/CategoryFilter';
import { PostCard } from './components/PostCard';
import { SortBar } from './components/SortBar';
import { TagFilter } from './components/TagFilter';

interface CategoryFilterItem {
  key: string;
  label: string;
}

const flattenPostCategories = (items: Array<Record<string, unknown>>, prefix = ''): CategoryFilterItem[] => {
  return items.flatMap((item) => {
    const id = String(item.id ?? '').trim();
    const name = String(item.name ?? '').trim();
    const type = String(item.type ?? '').trim();
    const label = prefix ? `${prefix} / ${name}` : name;
    const children = Array.isArray(item.children) ? (item.children as Array<Record<string, unknown>>) : [];

    const current = id && name && type === 'post' ? [{ key: id, label }] : [];
    return [...current, ...flattenPostCategories(children, label)];
  });
};

const ForumListPage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<CategoryFilterItem[]>([{ key: 'all', label: '全部' }]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      setMetaLoading(true);

      try {
        const [categoryRes, hotTagRes] = await Promise.all([categoryApi.list(), tagApi.hot()]);
        const categoryTree = extractData<Array<Record<string, unknown>>>(categoryRes, []);
        const dynamicCategories = flattenPostCategories(categoryTree);
        setCategoryItems([{ key: 'all', label: '全部' }, ...dynamicCategories]);

        const hotTags = extractList<Record<string, unknown>>(hotTagRes)
          .map((item) => String(item.name ?? '').trim())
          .filter(Boolean);
        setTagOptions(Array.from(new Set(hotTags)));
      } catch {
        setCategoryItems([{ key: 'all', label: '全部' }]);
        setTagOptions([]);
      } finally {
        setMetaLoading(false);
      }
    };

    void fetchMeta();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await postApi.list({
          page: 1,
          limit: 20,
          sort,
          category: category !== 'all' ? category : undefined,
          tag: tags[0] || undefined,
        });

        const list = extractList<Record<string, unknown>>(response).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.title ?? '未命名帖子'),
          summary: String(item.summary ?? item.content ?? '').slice(0, 120),
          category:
            typeof item.category === 'object' && item.category
              ? String((item.category as { name?: string }).name ?? '')
              : String(item.category ?? ''),
          tags: Array.isArray(item.tags)
            ? (item.tags as Array<{ tag?: { name?: string } }>).map((entry) => String(entry.tag?.name ?? '')).filter(Boolean)
            : [],
          author:
            typeof item.author === 'object' && item.author
              ? {
                  id: String((item.author as { id?: string }).id ?? ''),
                  username: String(
                    (item.author as { nickname?: string; username?: string }).nickname ??
                      (item.author as { username?: string }).username ??
                      '匿名用户',
                  ),
                }
              : { id: '', username: '匿名用户' },
          views: Number(item.viewCount ?? item.views ?? 0),
          replyCount: Number(item.commentCount ?? item.replyCount ?? 0),
          status: String(item.status ?? ''),
        }));

        setPosts(list.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '帖子列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, [category, sort, tags]);

  const filtered = useMemo(() => {
    if (tags.length <= 1) {
      return posts;
    }

    const selected = new Set(tags.map((item) => item.toLowerCase()));
    return posts.filter((item) => {
      const postTags = new Set((item.tags ?? []).map((tag) => tag.toLowerCase()));
      return Array.from(selected).every((tag) => postTags.has(tag));
    });
  }, [posts, tags]);

  return (
    <div className="page-stack">
      <Card
        title="论坛讨论"
        extra={
          <Button onClick={() => navigate('/forum/create')}>
            <Plus size={14} /> 发布帖子
          </Button>
        }
        padding={20}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>参与技术讨论、经验分享与问题交流，沉淀高价值内容。</div>
          <div className="forum-filters">
            <CategoryFilter value={category} onChange={setCategory} items={categoryItems} />
            <SortBar value={sort} onChange={setSort} />
            <TagFilter value={tags} onChange={setTags} options={tagOptions} />
            <div className="forum-filter-bar">
              <span className="forum-filter-summary">
                当前排序：{sort} · 已选标签：{tags.join(' / ') || '无'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {(loading || metaLoading) && <Loading text="帖子加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" className="error-text">{error}</div>
        </Card>
      )}
      {!loading && !filtered.length && <Empty description="暂无符合条件的帖子" />}

      <div className="post-list stagger">
        {filtered.map((item) => (
          <Link key={item.id} to={`/forum/${item.id}`} style={{ position: 'relative' }}>
            {item.status === 'pending' && (
              <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--color-warningBg, #fff8e1)', color: 'var(--color-warning, #e65100)', border: '1px solid var(--color-warningBorder, #ffe0b2)' }}>
                审核中
              </span>
            )}
            <PostCard item={item} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ForumListPage;
