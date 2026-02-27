import { Button } from '../ui';

interface SearchHistoryProps {
  list: string[];
  onSelect: (keyword: string) => void;
  onClear: () => void;
}

export const SearchHistory = ({ list, onSelect, onClear }: SearchHistoryProps) => (
  <div style={{ display: 'grid', gap: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <strong>搜索历史</strong>
      <Button variant="ghost" onClick={onClear}>
        清空
      </Button>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {list.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 999,
            background: 'var(--color-surface)',
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);
