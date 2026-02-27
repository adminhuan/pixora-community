import { Card, Col, Row, Statistic } from 'antd';

interface StatsData {
  todayNewUsers: number;
  todayNewContents: number;
  activeUsers: number;
  pendingReports: number;
  pendingComments: number;
  totalUsers: number;
}

const defaultStats: StatsData = {
  todayNewUsers: 0,
  todayNewContents: 0,
  activeUsers: 0,
  pendingReports: 0,
  pendingComments: 0,
  totalUsers: 0,
};

export const StatsCards = ({ stats }: { stats?: Partial<StatsData> }) => {
  const merged = { ...defaultStats, ...stats };

  const items = [
    { title: '今日新增用户', value: merged.todayNewUsers },
    { title: '今日新增内容', value: merged.todayNewContents },
    { title: '活跃用户', value: merged.activeUsers },
    { title: '待处理举报', value: merged.pendingReports },
    { title: '待隐藏评论', value: merged.pendingComments },
    { title: '总注册用户', value: merged.totalUsers },
  ];

  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col key={item.title} xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={item.title} value={item.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};
