import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, message } from 'antd';
import { adminBlogApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { BlogFilters, type BlogFilterValue } from './components/BlogFilters';
import { BlogTable, type BlogRow } from './components/BlogTable';

const BlogManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [data, setData] = useState<BlogRow[]>([]);
  const [filterValue, setFilterValue] = useState<BlogFilterValue>({
    keyword: '',
    categoryId: 'all',
    status: 'all',
  });

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminBlogApi.blogs();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        title: String(item.title ?? '未命名博客'),
        author: String((item.author as { username?: string } | undefined)?.username ?? '-'),
        category: String((item.category as { name?: string } | undefined)?.name ?? '-'),
        categoryId: String((item.category as { id?: string } | undefined)?.id ?? ''),
        status: String(item.status ?? 'draft'),
        views: Number(item.viewCount ?? 0),
        createdAt: String(item.createdAt ?? ''),
        isRecommended: Boolean(item.isRecommended),
        isBanner: Boolean(item.isBanner),
      }));

      setData(list.filter((item) => item.key));
    } catch (err) {
      setError(getErrorMessage(err, '博客管理数据加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((item) => {
      if (item.categoryId) {
        map.set(item.categoryId, item.category);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [data]);

  const filteredData = useMemo(() => {
    const keyword = filterValue.keyword.trim().toLowerCase();
    return data.filter((item) => {
      const matchKeyword =
        !keyword || item.title.toLowerCase().includes(keyword) || item.author.toLowerCase().includes(keyword);
      const matchCategory = filterValue.categoryId === 'all' || item.categoryId === filterValue.categoryId;
      const matchStatus = filterValue.status === 'all' || item.status === filterValue.status;
      return matchKeyword && matchCategory && matchStatus;
    });
  }, [data, filterValue]);

  const toggleRecommend = async (record: BlogRow) => {
    setActionLoadingId(record.key);
    setError('');
    try {
      await adminBlogApi.recommend(record.key, { recommended: !record.isRecommended });
      message.success(record.isRecommended ? '已取消推荐' : '已设为推荐');
      await fetchBlogs();
    } catch (err) {
      setError(getErrorMessage(err, '更新推荐状态失败'));
    } finally {
      setActionLoadingId('');
    }
  };

  const toggleBanner = async (record: BlogRow) => {
    setActionLoadingId(record.key);
    setError('');
    try {
      await adminBlogApi.banner(record.key, { banner: !record.isBanner });
      message.success(record.isBanner ? '已取消轮播' : '已设为轮播');
      await fetchBlogs();
    } catch (err) {
      setError(getErrorMessage(err, '更新轮播状态失败'));
    } finally {
      setActionLoadingId('');
    }
  };

  const deleteBlog = async (record: BlogRow) => {
    setActionLoadingId(record.key);
    setError('');
    try {
      await adminBlogApi.deleteBlog(record.key);
      message.success('删除成功');
      await fetchBlogs();
    } catch (err) {
      setError(getErrorMessage(err, '删除博客失败'));
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <Card title="博客管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <BlogFilters
        value={filterValue}
        categoryOptions={categoryOptions}
        loading={loading}
        onChange={(patch) => setFilterValue((current) => ({ ...current, ...patch }))}
        onSearch={() => undefined}
        onReset={() => setFilterValue({ keyword: '', categoryId: 'all', status: 'all' })}
      />
      <BlogTable
        data={filteredData}
        actionLoadingId={actionLoadingId}
        onToggleRecommend={toggleRecommend}
        onToggleBanner={toggleBanner}
        onDelete={deleteBlog}
      />
    </Card>
  );
};

export default BlogManagePage;
