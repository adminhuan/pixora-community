import type { ContentItem } from '../../../types/common';
import { Card } from '../../../components/ui';
import { VoteButton } from './VoteButton';

interface AnswerItemProps {
  answer: ContentItem;
}

export const AnswerItem = ({ answer }: AnswerItemProps) => (
  <div id={answer.id ? `answer-${answer.id}` : undefined}>
    <Card>
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0, lineHeight: 1.7 }}>{answer.content ?? answer.summary}</p>
        <div className="button-row" style={{ justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-textSecondary)', fontSize: 12 }}>{answer.author?.username}</span>
          <VoteButton value={Number(answer.likes ?? answer.likeCount ?? 0)} />
        </div>
      </div>
    </Card>
  </div>
);
