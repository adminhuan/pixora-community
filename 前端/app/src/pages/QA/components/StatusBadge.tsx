import { Badge } from '../../../components/ui';

interface StatusBadgeProps {
  status: 'solved' | 'unsolved' | 'bounty';
}

const statusTextMap = {
  solved: '已解决',
  unsolved: '未解决',
  bounty: '悬赏中',
};

export const StatusBadge = ({ status }: StatusBadgeProps) => <Badge>{statusTextMap[status]}</Badge>;
