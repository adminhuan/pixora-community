import type { ContentItem } from '../../../types/common';
import { Badge, Card } from '../../../components/ui';
import { Eye, MessageSquare, User } from 'lucide-react';

interface PostCardProps {
  item: ContentItem;
}

export const PostCard = ({ item }: PostCardProps) => (
  <Card className="post-card" padding={18}>
    <div className="post-card-inner">
      <div className="post-card-header">
        <h3 className="post-card-title">{item.title}</h3>
        <div className="post-card-metrics" aria-label="帖子互动数据">
          <span className="post-card-metric" title="浏览量">
            <Eye size={13} />
            {Number(item.views ?? 0)}
          </span>
          <span className="post-card-metric" title="评论数">
            <MessageSquare size={13} />
            {Number(item.replyCount ?? 0)}
          </span>
        </div>
      </div>

      {item.summary && <p className="post-card-summary">{item.summary}</p>}

      <div className="post-card-footer">
        <span className="post-card-author">
          <User size={13} />
          {item.author?.username ?? '匿名用户'}
        </span>
        <Badge variant="brand">{item.category ?? '技术讨论'}</Badge>
      </div>
    </div>
  </Card>
);
