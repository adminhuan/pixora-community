import { Card, Col, Row, Statistic } from 'antd';

interface AuditStatsProps {
  passRate?: number;
  avgMinutes?: number;
  pendingCount?: number;
}

export const AuditStats = ({ passRate = 0, avgMinutes = 0, pendingCount = 0 }: AuditStatsProps) => (
  <Row gutter={[12, 12]}>
    <Col xs={24} sm={8}>
      <Card>
        <Statistic title="审核通过率" value={passRate} suffix="%" />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card>
        <Statistic title="平均处理时长" value={avgMinutes} suffix="分钟" />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card>
        <Statistic title="待处理队列" value={pendingCount} />
      </Card>
    </Col>
  </Row>
);
