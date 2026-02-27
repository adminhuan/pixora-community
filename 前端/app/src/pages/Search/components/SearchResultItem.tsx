import { SearchHighlight } from '../../../components/Search/SearchHighlight';
import { Card } from '../../../components/ui';

interface SearchResultItemProps {
  item: {
    id: string;
    title: string;
    summary: string;
    type: string;
  };
  keyword: string;
}

export const SearchResultItem = ({ item, keyword }: SearchResultItemProps) => (
  <Card>
    <div style={{ display: 'grid', gap: 8 }}>
      <h3 style={{ margin: 0 }}>
        <SearchHighlight text={item.title} keyword={keyword} />
      </h3>
      <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>
        <SearchHighlight text={item.summary} keyword={keyword} />
      </p>
      <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>类型：{item.type}</span>
    </div>
  </Card>
);
