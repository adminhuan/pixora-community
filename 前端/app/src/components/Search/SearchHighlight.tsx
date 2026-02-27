interface SearchHighlightProps {
  text: string;
  keyword: string;
}

export const SearchHighlight = ({ text, keyword }: SearchHighlightProps) => {
  if (!keyword.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${keyword})`, 'gi'));

  return (
    <>
      {parts.map((part, index) => {
        const matched = part.toLowerCase() === keyword.toLowerCase();

        return matched ? (
          <mark key={`${part}-${index}`} style={{ background: 'rgba(59,130,246,0.24)', color: 'inherit' }}>
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
};
