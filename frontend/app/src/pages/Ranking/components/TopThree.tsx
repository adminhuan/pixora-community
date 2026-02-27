interface TopThreeProps {
  users: Array<{ rank: number; username: string; points: number }>;
}

export const TopThree = ({ users }: TopThreeProps) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
    }}
  >
    {users.map((user) => (
      <div
        key={user.rank}
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 12,
          background: 'linear-gradient(160deg, rgba(37,99,235,0.14), rgba(59,130,246,0.06))',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>第 {user.rank} 名</div>
        <strong>{user.username}</strong>
        <div style={{ marginTop: 6 }}>{user.points} 分</div>
      </div>
    ))}
  </div>
);
