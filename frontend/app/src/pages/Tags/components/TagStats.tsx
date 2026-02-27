import { Card } from '../../../components/ui';

interface TagStatsProps {
  total: number;
  followed: number;
}

export const TagStats = ({ total, followed }: TagStatsProps) => (
  <Card title="标签统计">
    <div style={{ display: 'flex', gap: 24 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>标签总数</div>
        <strong style={{ fontSize: 20 }}>{total}</strong>
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>已关注</div>
        <strong style={{ fontSize: 20 }}>{followed}</strong>
      </div>
    </div>
  </Card>
);
