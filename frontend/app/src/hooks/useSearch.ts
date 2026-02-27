import { useMemo, useState } from 'react';
import { useDebounce } from './useDebounce';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const hasKeyword = useMemo(() => debouncedQuery.trim().length > 0, [debouncedQuery]);

  return {
    query,
    debouncedQuery,
    hasKeyword,
    setQuery,
  };
};
