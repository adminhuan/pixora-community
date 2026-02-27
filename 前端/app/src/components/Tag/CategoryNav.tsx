interface CategoryNavProps {
  list: Array<{ id: string; name: string }>;
  activeId?: string;
  onChange?: (id: string) => void;
}

export const CategoryNav = ({ list, activeId, onChange }: CategoryNavProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {list.map((item) => {
      const active = item.id === activeId;

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange?.(item.id)}
          style={{
            border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: active ? 'var(--color-primaryBg)' : 'var(--color-surface)',
            color: active ? 'var(--color-primaryDark)' : 'var(--color-textSecondary)',
            borderRadius: 999,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          {item.name}
        </button>
      );
    })}
  </div>
);
