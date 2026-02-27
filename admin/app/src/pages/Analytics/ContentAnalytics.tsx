import { useEffect, useMemo, useState } from 'react';
import { Alert, Space } from 'antd';
import { adminAnalyticsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';
import { DateRangePicker } from './components/DateRangePicker';
import { PieChart } from './components/PieChart';
import { RankingTable } from './components/RankingTable';
import { TrendChart } from './components/TrendChart';

const ContentAnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminAnalyticsApi.content();
        setMetrics(extractData<Record<string, number>>(response, {}));
      } catch (err) {
        setError(getErrorMessage(err, '内容分析加载失败'));
        setMetrics({});
      } finally {
        setLoading(false);
      }
    };

    void fetchContent();
  }, []);

  const trendData = useMemo(
    () => [
      { date: '帖子', value: Number(metrics.posts ?? 0) },
      { date: '问答', value: Number(metrics.questions ?? 0) },
      { date: '博客', value: Number(metrics.blogs ?? 0) },
      { date: '项目', value: Number(metrics.projects ?? 0) },
    ],
    [metrics],
  );

  const pieData = useMemo(
    () => [
      { name: '帖子', value: Number(metrics.posts ?? 0) },
      { name: '问答', value: Number(metrics.questions ?? 0) },
      { name: '博客', value: Number(metrics.blogs ?? 0) },
      { name: '项目', value: Number(metrics.projects ?? 0) },
    ],
    [metrics],
  );

  const rankData = useMemo(
    () =>
      pieData
        .map((item, index) => ({ key: `${index}-${item.name}`, name: item.name, value: item.value }))
        .sort((a, b) => b.value - a.value),
    [pieData],
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Alert type="error" showIcon message={error} />}
      <Space>
        <DateRangePicker />
      </Space>
      <TrendChart title="内容分布趋势" data={trendData} />
      <PieChart title="内容分类分布" data={pieData} />
      <RankingTable title="热门内容排行" data={rankData} />
      {loading && <div style={{ color: '#64748B' }}>数据加载中...</div>}
    </div>
  );
};

export default ContentAnalyticsPage;
