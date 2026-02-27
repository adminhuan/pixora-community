import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { seriesApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { extractData, getErrorMessage } from '../../utils';
import { SeriesNav } from './components/SeriesNav';

const SeriesDetailPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('系列详情');
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    const fetchSeries = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await seriesApi.detail(id);
        const data = extractData<Record<string, unknown> | null>(response, null);
        const blogs = Array.isArray(data?.blogs) ? (data?.blogs as Array<{ title?: string }>) : [];

        setTitle(String(data?.name ?? '系列详情'));
        setList(blogs.map((item) => String(item.title ?? '').trim()).filter(Boolean));
      } catch (err) {
        setError(getErrorMessage(err, '系列详情加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSeries();
  }, [id]);

  return (
    <Card title={title}>
      {loading && <Loading text="系列数据加载中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>
          {error}
        </div>
      )}
      <SeriesNav series={list.length ? list : ['暂无系列文章']} />
    </Card>
  );
};

export default SeriesDetailPage;
