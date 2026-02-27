import { Link } from 'react-router-dom';
import type { ContentItem } from '../../types/common';
import { Card, Empty } from '../ui';
import { TimeAgo } from './TimeAgo';

interface ContentListProps {
  list: ContentItem[];
}

const cardStyle = { display: 'grid', gap: 8 } as const;

export const ContentList = ({ list }: ContentListProps) => {
  if (!list.length) {
    return <Empty description="暂无内容" />;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {list.map((item) => {
        const authorName = String(item.author?.username ?? '').trim();
        const hasTime = Boolean(String(item.createdAt ?? '').trim());

        const contentNode = (
          <>
            <h3 style={{ fontSize: 18 }}>{item.title}</h3>
            <div style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>{item.summary || '暂无简介'}</div>
            <div style={{ color: 'var(--color-textSecondary)', fontSize: 12 }}>
              {authorName || '系统记录'}
              {hasTime ? (
                <>
                  {' '}
                  · <TimeAgo value={item.createdAt} />
                </>
              ) : null}
            </div>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              to={item.href}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              title="点击查看详情"
            >
              <Card>
                <div style={cardStyle}>{contentNode}</div>
              </Card>
            </Link>
          );
        }

        return (
          <Card key={item.id}>
            <div style={cardStyle}>{contentNode}</div>
          </Card>
        );
      })}
    </div>
  );
};
