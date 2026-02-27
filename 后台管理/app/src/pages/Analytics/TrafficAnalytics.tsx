import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'antd';
import { adminAnalyticsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';
import { TrendChart } from './components/TrendChart';
import { RankingTable } from './components/RankingTable';

const TrafficAnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchTraffic = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminAnalyticsApi.traffic();
        setMetrics(extractData<Record<string, number>>(response, {}));
      } catch (err) {
        setError(getErrorMessage(err, '流量分析加载失败'));
        setMetrics({});
      } finally {
        setLoading(false);
      }
    };

    void fetchTraffic();
  }, []);

  const trendData = useMemo(
    () => [
      { date: 'PV', value: Number(metrics.pv ?? 0) },
      { date: 'UV', value: Number(metrics.uv ?? 0) },
    ],
    [metrics],
  );

  const rankingData = useMemo(
    () => [
      { key: 'pv', name: '页面浏览量 PV', value: Number(metrics.pv ?? 0) },
      { key: 'uv', name: '独立访客 UV', value: Number(metrics.uv ?? 0) },
      { key: 'bounce', name: '跳出率', value: Number(metrics.bounceRate ?? 0) },
    ],
    [metrics],
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Alert type="error" showIcon message={error} />}
      <TrendChart title="PV / UV 趋势" data={trendData} />
      <RankingTable title="流量指标排行" data={rankingData} />
      {loading && <div style={{ color: '#64748B' }}>数据加载中...</div>}
    </div>
  );
};

export default TrafficAnalyticsPage;
