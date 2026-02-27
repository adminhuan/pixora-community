interface UserMentionProps {
  username: string;
}

export const UserMention = ({ username }: UserMentionProps) => (
  <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>@{username}</span>
);
