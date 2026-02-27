import type { ContentItem } from '../../../types/common';
import { Badge } from '../../../components/ui';
import { CodeBlock } from '../../../components/shared/CodeBlock';

interface CodeCardProps {
  item: ContentItem;
}

export const CodeCard = ({ item }: CodeCardProps) => (
  <div className="code-card">
    <h3 className="code-card-title">{item.title}</h3>
    <CodeBlock
      code={item.summary}
      language={item.category ?? 'typescript'}
      filename={item.title}
      maxHeight={200}
    />
    <div className="code-card-meta">
      <span className="code-card-author">{item.author?.username}</span>
      <Badge>{item.category ?? 'TypeScript'}</Badge>
    </div>
  </div>
);
