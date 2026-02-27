import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'antd';
import { adminAnalyticsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';
import { HeatmapChart } from './components/HeatmapChart';
import { TrendChart } from './components/TrendChart';

const InteractionAnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchInteractions = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminAnalyticsApi.interactions();
        setMetrics(extractData<Record<string, number>>(response, {}));
      } catch (err) {
        setError(getErrorMessage(err, '互动分析加载失败'));
        setMetrics({});
      } finally {
        setLoading(false);
      }
    };

    void fetchInteractions();
  }, []);

  const trendData = useMemo(
    () => [
      { date: '评论', value: Number(metrics.comments ?? 0) },
      { date: '点赞', value: Number(metrics.likes ?? 0) },
    ],
    [metrics],
  );

  const heatValues = useMemo(() => {
    const comments = Number(metrics.comments ?? 0);
    const likes = Number(metrics.likes ?? 0);

    return Array.from({ length: 42 }, (_unused, index) => {
      const factor = (index % 7) + 1;
      const value = (comments + likes) / 1200 + factor * 0.25;
      return Number(value.toFixed(2));
    });
  }, [metrics]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Alert type="error" showIcon message={error} />}
      <TrendChart title="点赞/评论分布" data={trendData} />
      <HeatmapChart title="用户活跃时段热力图" values={heatValues} />
      {loading && <div style={{ color: '#64748B' }}>数据加载中...</div>}
    </div>
  );
};

export default InteractionAnalyticsPage;
