import { useEffect, useMemo, useState } from 'react';
import { Alert, Col, Row } from 'antd';
import { adminDashboardApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';
import { ActivityChart } from './ActivityChart';
import { ContentPieChart } from './ContentPieChart';
import { GrowthChart } from './GrowthChart';
import { RecentActions } from './RecentActions';
import { StatsCards } from './StatsCards';

interface DashboardStats {
  todayNewUsers: number;
  todayNewContents: number;
  totalUsers: number;
  pendingReports: number;
  pendingComments: number;
  activeUsers: number;
}

const DashboardPage = () => {
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Partial<DashboardStats>>({});
  const [growthData, setGrowthData] = useState<Array<{ date: string; user: number; content: number }>>([]);
  const [activityData, setActivityData] = useState<Array<{ time: string; active: number }>>([]);
  const [pieData, setPieData] = useState<Array<{ name: string; value: number }>>([]);
  const [recentLogs, setRecentLogs] = useState<
    Array<{ id?: string; action?: string; operator?: string; ip?: string; time?: string }>
  >([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setError('');

      try {
        const [statsRes, pendingRes, activityRes, logsRes, trendsRes] = await Promise.all([
          adminDashboardApi.stats(),
          adminDashboardApi.pending(),
          adminDashboardApi.activity(),
          adminDashboardApi.recentLogs(),
          adminDashboardApi.trends(),
        ]);

        const statsData = extractData<Record<string, unknown>>(statsRes, {});
        const pendingData = extractData<Record<string, unknown>>(pendingRes, {});
        const activityDataRaw = extractData<Record<string, unknown>>(activityRes, {});
        const logsData = extractData<Array<Record<string, unknown>>>(logsRes, []);
        const trendsData = extractData<Record<string, unknown>>(trendsRes, {});

        const activeByHour = Array.isArray(activityDataRaw.activeByHour)
          ? (activityDataRaw.activeByHour as Array<{ hour?: number; count?: number }>)
          : [];

        const topTags = Array.isArray(activityDataRaw.topTags)
          ? (activityDataRaw.topTags as Array<{ name?: string; usageCount?: number }>)
          : [];

        const userSeries = Array.isArray(trendsData.users)
          ? (trendsData.users as Array<{ day?: string; users?: number }>)
          : [];
        const contentSeries = Array.isArray(trendsData.contents)
          ? (trendsData.contents as Array<{ day?: string; contents?: number }>)
          : [];

        const contentMap = new Map(contentSeries.map((item) => [String(item.day ?? ''), Number(item.contents ?? 0)]));

        setStats({
          todayNewUsers: Number(statsData.todayNewUsers ?? 0),
          todayNewContents: Number(statsData.todayNewContents ?? 0),
          totalUsers: Number(statsData.totalUsers ?? 0),
          pendingReports: Number(pendingData.pendingReports ?? 0),
          pendingComments: Number(pendingData.pendingComments ?? 0),
          activeUsers: activeByHour.reduce((sum, item) => sum + Number(item.count ?? 0), 0),
        });

        setGrowthData(
          userSeries.map((item) => ({
            date: String(item.day ?? ''),
            user: Number(item.users ?? 0),
            content: Number(contentMap.get(String(item.day ?? '')) ?? 0),
          })),
        );

        setActivityData(
          activeByHour.map((item) => ({
            time: `${String(item.hour ?? 0).padStart(2, '0')}:00`,
            active: Number(item.count ?? 0),
          })),
        );

        setPieData(
          topTags.slice(0, 5).map((item) => ({
            name: String(item.name ?? '标签'),
            value: Number(item.usageCount ?? 0),
          })),
        );

        setRecentLogs(
          logsData.map((item, index) => ({
            id: String(item.id ?? index),
            action: String(item.action ?? item.type ?? '后台操作'),
            operator: String(item.operator ?? item.user ?? 'system'),
            ip: String(item.ip ?? '-'),
            time: String(item.time ?? item.createdAt ?? ''),
          })),
        );
      } catch (err) {
        setError(getErrorMessage(err, '仪表盘数据加载失败，请确认已使用管理员账号登录'));
      }
    };

    void fetchDashboardData();
  }, []);

  const normalizedPieData = useMemo(() => {
    if (pieData.length > 0) {
      return pieData;
    }

    return [
      { name: '帖子', value: 0 },
      { name: '问答', value: 0 },
      { name: '博客', value: 0 },
      { name: '项目', value: 0 },
    ];
  }, [pieData]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Alert type="error" showIcon message={error} />}
      <StatsCards stats={stats} />
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <GrowthChart data={growthData} />
        </Col>
        <Col xs={24} lg={8}>
          <ContentPieChart data={normalizedPieData} />
        </Col>
        <Col xs={24} lg={16}>
          <ActivityChart data={activityData} />
        </Col>
        <Col xs={24} lg={8}>
          <RecentActions actions={recentLogs} />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
