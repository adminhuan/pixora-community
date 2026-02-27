import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Row, Statistic } from 'antd';
import { adminTagApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { TagTrendChart } from './components/TagTrendChart';

const TagStatsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminTagApi.tags();
        setData(extractList<Record<string, unknown>>(response));
      } catch (err) {
        setError(getErrorMessage(err, '标签统计加载失败'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTags();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

    const total = data.length;
    const weeklyNew = data.filter((item) => {
      const createdAt = Date.parse(String(item.createdAt ?? ''));
      return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
    }).length;
    const hotCount = data.filter((item) => Number(item.usageCount ?? 0) >= 50).length;

    const trendMap = new Map<string, { usage: number; followers: number }>();
    data.forEach((item) => {
      const date = String(item.createdAt ?? '').slice(0, 10);
      if (!date) {
        return;
      }

      const current = trendMap.get(date) ?? { usage: 0, followers: 0 };
      current.usage += Number(item.usageCount ?? 0);
      current.followers += Number(item.followersCount ?? 0);
      trendMap.set(date, current);
    });

    const trend = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, value]) => ({ date, usage: value.usage, followers: value.followers }));

    return {
      total,
      weeklyNew,
      hotCount,
      trend,
    };
  }, [data]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Alert type="error" showIcon message={error} />}
      <Row gutter={[12, 12]}>
        <Col span={24} md={8}>
          <Card loading={loading}>
            <Statistic title="标签总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card loading={loading}>
            <Statistic title="本周新增" value={stats.weeklyNew} />
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card loading={loading}>
            <Statistic title="热门标签" value={stats.hotCount} />
          </Card>
        </Col>
      </Row>
      <TagTrendChart data={stats.trend} />
    </div>
  );
};

export default TagStatsPage;
