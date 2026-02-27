import type { ContentItem } from '../../../types/common';
import { Card } from '../../../components/ui';
import { resolveSafeImageSrc } from '../../../utils';

interface ArticleCardProps {
  article: ContentItem;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const cover = article.coverImage
    ? resolveSafeImageSrc(article.coverImage, { allowDataImage: true, allowRelative: true })
    : '';

  return (
    <Card>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'grid', gap: 6, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.4 }}>{article.title}</h3>
          <p
            style={{
              margin: 0,
              color: 'var(--color-textSecondary)',
              fontSize: 13,
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {article.summary}
          </p>
          <div style={{ color: 'var(--color-textSecondary)', fontSize: 12 }}>
            {article.author?.username} · {article.views ?? 0} 阅读
          </div>
        </div>
        {cover && (
          <div style={{ width: 120, height: 80, flexShrink: 0, borderRadius: 6, overflow: 'hidden' }}>
            <img
              src={cover}
              alt=""
              style={{
                width: 120,
                height: 80,
                maxWidth: 120,
                maxHeight: 80,
                objectFit: 'cover',
                display: 'inline-block'
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
