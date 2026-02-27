import type { ContentItem } from '../../types/common';
import { CommentItem } from './CommentItem';

interface ReplyListProps {
  replies: ContentItem[];
}

export const ReplyList = ({ replies }: ReplyListProps) => (
  <div style={{ marginLeft: 24, display: 'grid', gap: 8 }}>
    {replies.map((reply) => (
      <CommentItem key={reply.id} item={reply} />
    ))}
  </div>
);
