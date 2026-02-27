import { RankingCard } from './RankingCard';

interface RankingUser {
  rank: number;
  username: string;
  points: number;
  level: string;
}

interface RankingListProps {
  list: RankingUser[];
}

export const RankingList = ({ list }: RankingListProps) => (
  <div style={{ display: 'grid', gap: 10 }}>
    {list.map((item) => (
      <RankingCard key={item.rank} {...item} />
    ))}
  </div>
);
