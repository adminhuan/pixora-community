import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchApi } from '../../api';
import { SearchBar } from '../../components/Search/SearchBar';
import { SearchHistory } from '../../components/Search/SearchHistory';
import { SearchSuggestions } from '../../components/Search/SearchSuggestions';
import { Card, Empty, Loading } from '../../components/ui';
import { useDebounce, useLocalStorage } from '../../hooks';
import { extractList, getErrorMessage } from '../../utils';
import { SearchFilters } from './components/SearchFilters';
import { SearchResultItem } from './components/SearchResultItem';
import { SearchTabs } from './components/SearchTabs';

interface SearchResultRecord {
  id: string;
  title: string;
  summary: string;
  type: string;
}

const SearchResultsPage = () => {
  const [params, setParams] = useSearchParams();
  const keyword = params.get('q') ?? '';
  const [activeTab, setActiveTab] = useState(params.get('type') ?? 'all');
  const [sort, setSort] = useState('relevance');
  const [history, setHistory] = useLocalStorage<string[]>('apc_search_history', []);
  const [input, setInput] = useState(keyword);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResultRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debouncedInput = useDebounce(input, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedInput.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await searchApi.suggestions(debouncedInput);
        const list = extractList<Record<string, unknown>>(response)
          .map((item) => String(item.keyword ?? item.title ?? item.value ?? '').trim())
          .filter(Boolean)
          .slice(0, 8);

        setSuggestions(list);
      } catch {
        setSuggestions([]);
      }
    };

    void fetchSuggestions();
  }, [debouncedInput]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!keyword.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await searchApi.search({ q: keyword, type: activeTab, sort, page: 1, limit: 20 });
        const list = extractList<Record<string, unknown>>(response).map((item) => ({
          id: String(item.id ?? item.objectId ?? ''),
          title: String(item.title ?? item.name ?? '未命名结果'),
          summary: String(item.summary ?? item.excerpt ?? item.content ?? '').slice(0, 160),
          type: String(item.type ?? item.targetType ?? activeTab),
        }));

        setResults(list.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '搜索失败，请稍后重试'));
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchResults();
  }, [activeTab, keyword, sort]);

  const handleSearch = () => {
    const nextQuery = input.trim();
    setParams({ q: nextQuery, type: activeTab });

    if (nextQuery && !history.includes(nextQuery)) {
      setHistory([nextQuery, ...history].slice(0, 10));
    }
  };

  const displayList = useMemo(() => {
    if (activeTab === 'all') {
      return results;
    }

    return results.filter((item) => item.type.toLowerCase().includes(activeTab));
  }, [activeTab, results]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <SearchBar value={input} onChange={setInput} onSearch={handleSearch} />
      <SearchSuggestions
        list={suggestions}
        onSelect={(value) => {
          setInput(value);
          setParams({ q: value, type: activeTab });
        }}
      />
      <SearchHistory list={history} onSelect={setInput} onClear={() => setHistory([])} />
      <SearchTabs
        active={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setParams({ q: keyword, type: key });
        }}
      />
      <SearchFilters sort={sort} onSortChange={setSort} />

      {loading && <Loading text="搜索中..." />}
      {error && (
        <Card title="搜索提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {!loading && keyword && !displayList.length && <Empty description="没有找到相关内容" />}

      {displayList.map((item) => (
        <SearchResultItem key={item.id} item={item} keyword={keyword} />
      ))}
    </div>
  );
};

export default SearchResultsPage;
