import { Card } from '../../../components/ui';

interface ProfileStatsProps {
  stats: Array<{ label: string; value: number }>;
}

export const ProfileStats = ({ stats }: ProfileStatsProps) => (
  <Card title="数据统计">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
      {stats.map((item) => (
        <div key={item.label} style={{ padding: 10, border: '1px solid var(--color-border)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>{item.label}</div>
          <strong style={{ fontSize: 20 }}>{item.value}</strong>
        </div>
      ))}
    </div>
  </Card>
);
