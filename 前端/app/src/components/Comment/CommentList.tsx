import { useMemo, useState, type ReactNode } from 'react';
import type { ContentItem } from '../../types/common';
import { Button, Empty } from '../ui';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  list: ContentItem[];
  onLike?: (item: ContentItem) => void;
  onReply?: (item: ContentItem) => void;
  onReport?: (item: ContentItem) => void;
  emptyDescription?: string;
  interactionDisabled?: boolean;
}

const sortByTime = (a: ContentItem, b: ContentItem) => {
  const left = new Date(String(a.createdAt ?? 0)).getTime();
  const right = new Date(String(b.createdAt ?? 0)).getTime();
  return left - right;
};

const countDescendants = (id: string, map: Map<string, ContentItem[]>, cache: Map<string, number>): number => {
  const cached = cache.get(id);
  if (cached !== undefined) {
    return cached;
  }

  const children = map.get(id) ?? [];
  const total = children.reduce((sum, child) => sum + 1 + countDescendants(child.id, map, cache), 0);
  cache.set(id, total);
  return total;
};

export const CommentList = ({
  list,
  onLike,
  onReply,
  onReport,
  emptyDescription = '还没有评论，欢迎抢先发言',
  interactionDisabled = false,
}: CommentListProps) => {
  const sorted = useMemo(() => [...list].sort(sortByTime), [list]);

  const roots = useMemo(() => sorted.filter((item) => !item.parentId), [sorted]);

  const childrenMap = useMemo(() => {
    const map = new Map<string, ContentItem[]>();

    sorted.forEach((item) => {
      if (!item.parentId) {
        return;
      }

      const current = map.get(item.parentId) ?? [];
      current.push(item);
      map.set(item.parentId, current);
    });

    return map;
  }, [sorted]);

  const collapsibleIds = useMemo(() => new Set(Array.from(childrenMap.keys())), [childrenMap]);

  const rootCollapsibleIds = useMemo(
    () => roots.filter((item) => (childrenMap.get(item.id) ?? []).length > 0).map((item) => item.id),
    [roots, childrenMap],
  );

  const descendantsCountMap = useMemo(() => {
    const cache = new Map<string, number>();
    Array.from(collapsibleIds).forEach((id) => {
      countDescendants(id, childrenMap, cache);
    });
    return cache;
  }, [childrenMap, collapsibleIds]);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [defaultCollapseDeepEnabled, setDefaultCollapseDeepEnabled] = useState(false);

  const activeCollapsedIds = useMemo(
    () => new Set(Array.from(collapsedIds).filter((id) => collapsibleIds.has(id))),
    [collapsedIds, collapsibleIds],
  );

  if (!list.length) {
    return <Empty description={emptyDescription} />;
  }

  const allCollapsed = collapsibleIds.size > 0 && activeCollapsedIds.size === collapsibleIds.size;

  const toggleChildren = (item: ContentItem) => {
    if (!collapsibleIds.has(item.id)) {
      return;
    }

    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const renderNode = (item: ContentItem): ReactNode => {
    const children = childrenMap.get(item.id) ?? [];
    const hasChildren = children.length > 0;
    const isChildrenCollapsed = activeCollapsedIds.has(item.id);
    const childrenCount = descendantsCountMap.get(item.id) ?? children.length;

    return (
      <div key={item.id} style={{ display: 'grid', gap: 10 }}>
        <CommentItem
          item={item}
          onLike={onLike}
          onReply={onReply}
          onReport={onReport}
          hasChildren={hasChildren}
          isChildrenCollapsed={isChildrenCollapsed}
          childrenCount={childrenCount}
          onToggleChildren={toggleChildren}
          interactionDisabled={interactionDisabled}
        />

        {hasChildren && !isChildrenCollapsed && (
          <div
            style={{
              display: 'grid',
              gap: 10,
              marginLeft: 18,
              paddingLeft: 10,
              borderLeft: '1px solid var(--c-border-light)',
            }}
          >
            {children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {collapsibleIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Button
            variant={defaultCollapseDeepEnabled ? 'secondary' : 'outline'}
            onClick={() => {
              const next = !defaultCollapseDeepEnabled;
              setDefaultCollapseDeepEnabled(next);
              setCollapsedIds(next ? new Set(rootCollapsibleIds) : new Set());
            }}
            disabled={rootCollapsibleIds.length === 0}
          >
            默认折叠二级及以上回复：{defaultCollapseDeepEnabled ? '开' : '关'}
          </Button>

          <div className="button-row" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setCollapsedIds(new Set(Array.from(collapsibleIds)));
              }}
              disabled={allCollapsed}
            >
              收起全部回复
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCollapsedIds(new Set());
                setDefaultCollapseDeepEnabled(false);
              }}
              disabled={activeCollapsedIds.size === 0 && !defaultCollapseDeepEnabled}
            >
              展开全部回复
            </Button>
          </div>
        </div>
      )}

      {roots.map((item) => renderNode(item))}
    </div>
  );
};
