import type { UserBrief } from '../../types/common';
import { Avatar, Card } from '../ui';

interface AuthorCardProps {
  author: UserBrief;
}

export const AuthorCard = ({ author }: AuthorCardProps) => (
  <Card>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Avatar src={author.avatar} name={author.username} />
      <div>
        <div style={{ fontWeight: 600 }}>{author.username}</div>
        <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>
          {author.level ?? '普通开发者'}
        </div>
      </div>
    </div>
  </Card>
);
