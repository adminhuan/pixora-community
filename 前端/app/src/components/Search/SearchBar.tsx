import type { KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = '搜索帖子、问答、博客、项目',
}: SearchBarProps) => {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch?.();
    }
  };

  return (
    <div className="apc-search">
      <Search size={15} strokeWidth={2.2} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
};
