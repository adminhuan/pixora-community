import { Avatar, Button, Card } from '../../../components/ui';

interface ProfileHeaderProps {
  username: string;
  bio?: string;
  onFollow?: () => void;
  onMessage?: () => void;
}

export const ProfileHeader = ({ username, bio, onFollow, onMessage }: ProfileHeaderProps) => (
  <Card>
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          height: 120,
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'linear-gradient(120deg, rgba(37,99,235,0.2), rgba(59,130,246,0.06))',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={username} size={52} />
          <div>
            <h2 style={{ margin: 0 }}>{username}</h2>
            <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>{bio || '这个人很懒，还没有填写简介'}</p>
          </div>
        </div>
        <div className="button-row">
          {onMessage ? (
            <Button variant="outline" onClick={onMessage}>
              私信
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onFollow} disabled={!onFollow}>
            关注
          </Button>
        </div>
      </div>
    </div>
  </Card>
);
