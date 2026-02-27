import { LevelIcon } from './LevelIcon';

interface PointsBadgeProps {
  points: number;
  level: string;
}

export const PointsBadge = ({ points, level }: PointsBadgeProps) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <LevelIcon level={level} />
    <span style={{ fontWeight: 700, color: 'var(--color-primaryDark)' }}>{points} 积分</span>
  </div>
);
