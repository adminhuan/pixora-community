import type { UserBrief } from '../../../types/common';
import { Avatar, Button, Card } from '../../../components/ui';

interface UserCardProps {
  user: UserBrief;
}

export const UserCard = ({ user }: UserCardProps) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Avatar src={user.avatar} name={user.username} />
        <span>{user.username}</span>
      </div>
      <Button variant="outline">关注</Button>
    </div>
  </Card>
);
