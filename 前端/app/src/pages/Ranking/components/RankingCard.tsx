import { Avatar, Card } from '../../../components/ui';
import { PointsBadge } from '../../../components/Points/PointsBadge';

interface RankingCardProps {
  rank: number;
  username: string;
  points: number;
  level: string;
}

export const RankingCard = ({ rank, username, points, level }: RankingCardProps) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <strong style={{ minWidth: 24, color: 'var(--color-primaryDark)' }}>{rank}</strong>
        <Avatar name={username} />
        <span>{username}</span>
      </div>
      <PointsBadge points={points} level={level} />
    </div>
  </Card>
);
