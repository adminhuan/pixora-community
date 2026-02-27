import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { blogApi } from '../../api';
import { Button, Card, Empty, Loading } from '../../components/ui';
import type { ContentItem } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';
import { ArticleCard } from './components/ArticleCard';
import { CategoryNav } from './components/CategoryNav';

const BlogListPage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [blogs, setBlogs] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await blogApi.list({ page: 1, limit: 20 });
        const data = extractList<Record<string, unknown>>(response).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.title ?? '未命名博客'),
          summary: String(item.summary ?? item.excerpt ?? item.content ?? '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/[#*>`[\]]/g, '')
            .trim()
            .slice(0, 120),
          category: String(item.category ?? item.categoryName ?? '').toLowerCase(),
          coverImage: String(item.coverImage ?? ''),
          views: Number(item.viewCount ?? item.views ?? 0),
          status: String(item.status ?? ''),
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
        }));

        setBlogs(data.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '博客列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogs();
  }, []);

  const filtered = useMemo(() => {
    if (!category || category === 'all') {
      return blogs;
    }

    return blogs.filter((item) => String(item.category ?? '').includes(category));
  }, [blogs, category]);

  const categoryItems = useMemo(() => {
    const items = blogs
      .map((item) => String(item.category ?? '').trim())
      .filter(Boolean)
      .reduce<Array<{ key: string; label: string }>>((acc, value) => {
        const key = value.toLowerCase();
        if (!acc.some((item) => item.key === key)) {
          acc.push({ key, label: value });
        }
        return acc;
      }, []);

    return [{ key: 'all', label: '全部' }, ...items];
  }, [blogs]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="技术博客"
        extra={
          <Button onClick={() => navigate('/blog/write')}>
            <Plus size={14} /> 发布博客
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>输出你的技术思考、项目复盘与最佳实践，建立个人技术影响力。</div>
          <CategoryNav value={category} onChange={setCategory} items={categoryItems} />
        </div>
      </Card>
      {loading && <Loading text="博客加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {!loading && !filtered.length && <Empty description="暂无博客内容" />}
      {filtered.map((article) => (
        <Link key={article.id} to={`/blog/${article.id}`} style={{ position: 'relative' }}>
          {article.status === 'pending' && (
            <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--color-warningBg, #fff8e1)', color: 'var(--color-warning, #e65100)', border: '1px solid var(--color-warningBorder, #ffe0b2)' }}>
              审核中
            </span>
          )}
          <ArticleCard article={article} />
        </Link>
      ))}
    </div>
  );
};

export default BlogListPage;
