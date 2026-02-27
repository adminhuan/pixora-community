interface MentionSelectProps {
  users: string[];
  onSelect: (username: string) => void;
}

export const MentionSelect = ({ users, onSelect }: MentionSelectProps) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {users.map((user) => (
      <button
        key={user}
        type="button"
        onClick={() => onSelect(user)}
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 999,
          background: 'var(--color-surface)',
          color: 'var(--color-textSecondary)',
          padding: '2px 10px',
          cursor: 'pointer',
        }}
      >
        @{user}
      </button>
    ))}
  </div>
);
