import type { ContentItem } from '../../../types/common';
import { Badge, Card } from '../../../components/ui';

interface QuestionCardProps {
  item: ContentItem;
}

export const QuestionCard = ({ item }: QuestionCardProps) => (
  <Card>
    <div style={{ display: 'grid', gap: 8 }}>
      <h3 style={{ fontSize: 18 }}>{item.title}</h3>
      <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>{item.summary}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>{item.author?.username}</span>
        <Badge>{item.category ?? '未解决'}</Badge>
      </div>
    </div>
  </Card>
);
