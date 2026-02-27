import { Badge } from '../../../components/ui';

interface BountyBadgeProps {
  amount: number;
}

export const BountyBadge = ({ amount }: BountyBadgeProps) => (
  <Badge variant="warning">
    悬赏 {amount} 积分
  </Badge>
);
