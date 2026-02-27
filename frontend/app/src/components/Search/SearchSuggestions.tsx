interface SearchSuggestionsProps {
  list: string[];
  onSelect: (value: string) => void;
}

export const SearchSuggestions = ({ list, onSelect }: SearchSuggestionsProps) => {
  if (!list.length) {
    return null;
  }

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: 8,
        background: 'var(--color-surface)',
        boxShadow: '0 8px 24px rgba(2,6,23,0.08)',
      }}
    >
      {list.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          style={{
            width: '100%',
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            padding: '6px 8px',
            borderRadius: 8,
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
};
