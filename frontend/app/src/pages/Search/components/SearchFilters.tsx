import { Card } from '../../../components/ui';

interface SearchFiltersProps {
  sort: string;
  onSortChange: (value: string) => void;
}

export const SearchFilters = ({ sort, onSortChange }: SearchFiltersProps) => (
  <Card title="排序方式">
    <select className="input" value={sort} onChange={(e) => onSortChange(e.target.value)}>
      <option value="relevance">按相关度</option>
      <option value="latest">按最新</option>
      <option value="hot">按最热</option>
    </select>
  </Card>
);
