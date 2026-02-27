import type { ContentItem } from '../../types/common';
import { Avatar, Button, Card } from '../ui';
import { TimeAgo } from '../shared/TimeAgo';

interface CommentItemProps {
  item: ContentItem;
  onLike?: (item: ContentItem) => void;
  onReply?: (item: ContentItem) => void;
  onReport?: (item: ContentItem) => void;
  hasChildren?: boolean;
  isChildrenCollapsed?: boolean;
  childrenCount?: number;
  onToggleChildren?: (item: ContentItem) => void;
  interactionDisabled?: boolean;
}

export const CommentItem = ({
  item,
  onLike,
  onReply,
  onReport,
  hasChildren,
  isChildrenCollapsed,
  childrenCount,
  onToggleChildren,
  interactionDisabled = false,
}: CommentItemProps) => (
  <Card>
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Avatar src={item.author?.avatar} name={item.author?.username} size={28} />
          <strong>{item.author?.username ?? '匿名用户'}</strong>
        </div>
        <span style={{ color: 'var(--color-textSecondary)', fontSize: 12 }}>
          <TimeAgo value={item.createdAt} />
        </span>
      </div>

      <p style={{ margin: 0, lineHeight: 1.7 }}>{item.content ?? item.summary}</p>

      <div className="button-row">
        {hasChildren && Number(childrenCount ?? 0) > 0 && (
          <Button variant="ghost" onClick={() => onToggleChildren?.(item)}>
            {isChildrenCollapsed ? `展开回复 ${Number(childrenCount)}` : `收起回复 ${Number(childrenCount)}`}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => onLike?.(item)}
          disabled={interactionDisabled}
          title={interactionDisabled ? '请登录后操作' : undefined}
        >
          点赞 {Number(item.likeCount ?? item.likes ?? 0)}
        </Button>
        <Button
          variant="ghost"
          onClick={() => onReply?.(item)}
          disabled={interactionDisabled}
          title={interactionDisabled ? '请登录后操作' : undefined}
        >
          回复{Number(item.replyCount ?? 0) > 0 ? ` ${Number(item.replyCount ?? 0)}` : ''}
        </Button>
        <Button
          variant="ghost"
          onClick={() => onReport?.(item)}
          disabled={interactionDisabled}
          title={interactionDisabled ? '请登录后操作' : undefined}
        >
          举报
        </Button>
      </div>
    </div>
  </Card>
);
