import { Card, Empty } from '../ui';

interface AchievementWallProps {
  achievements: string[];
}

export const AchievementWall = ({ achievements }: AchievementWallProps) => {
  if (!achievements.length) {
    return (
      <Card title="成就墙">
        <Empty description="暂无成就" />
      </Card>
    );
  }

  return (
    <Card title="成就墙">
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {achievements.map((achievement) => (
          <div
            key={achievement}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 12,
              background: 'var(--color-surface)',
              textAlign: 'center',
            }}
          >
            <strong style={{ fontSize: 14 }}>{achievement}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
};
