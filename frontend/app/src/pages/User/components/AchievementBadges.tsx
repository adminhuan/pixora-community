import { AchievementWall } from '../../../components/Points/AchievementWall';

interface AchievementBadgesProps {
  list: string[];
}

export const AchievementBadges = ({ list }: AchievementBadgesProps) => <AchievementWall achievements={list} />;
