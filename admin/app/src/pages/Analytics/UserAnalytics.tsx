import { useEffect, useMemo, useState } from 'react';
import { Alert, Space } from 'antd';
import { adminAnalyticsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';
import { DateRangePicker } from './components/DateRangePicker';
import { FunnelChart } from './components/FunnelChart';
import { TrendChart } from './components/TrendChart';

const UserAnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminAnalyticsApi.users();
        setMetrics(extractData<Record<string, number>>(response, {}));
      } catch (err) {
        setError(getErrorMessage(err, '用户分析加载失败'));
        setMetrics({});
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  const trendData = useMemo(
    () => [
      { date: '总用户', value: Number(metrics.total ?? 0) },
      { date: '活跃用户', value: Number(metrics.active ?? 0) },
      { date: '封禁用户', value: Number(metrics.banned ?? 0) },
    ],
    [metrics],
  );

  const funnelSteps = useMemo(
    () => [
      { name: '总用户', value: Number(metrics.total ?? 0) },
      { name: '活跃用户', value: Number(metrics.active ?? 0) },
      { name: '封禁用户', value: Number(metrics.banned ?? 0) },
    ],
    [metrics],
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Alert type="error" showIcon message={error} />}
      <Space>
        <DateRangePicker />
      </Space>
      <TrendChart title="用户概览趋势" data={trendData} />
      <FunnelChart title="用户状态漏斗" steps={funnelSteps} />
      {loading && <div style={{ color: '#64748B' }}>数据加载中...</div>}
    </div>
  );
};

export default UserAnalyticsPage;
