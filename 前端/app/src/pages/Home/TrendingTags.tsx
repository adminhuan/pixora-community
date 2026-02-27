import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Empty } from '../../components/ui';
import { TagBadge } from '../../components/Tag/TagBadge';
import { trackHomeClick } from '../../utils';

interface TrendingTagsProps {
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export const TrendingTags = ({ tags }: TrendingTagsProps) => (
  <section className="home-section animate-fade-in">
    <header className="home-section-header">
      <h3 className="home-section-title">
        <span className="home-section-icon home-section-icon--trend"><TrendingUp size={16} /></span>
        热门标签
      </h3>
      <span className="home-section-extra">趋势云图</span>
    </header>
    {tags.length ? (
      <div className="apc-tag-cloud stagger">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to={`/tags/${tag.id}?from=home`}
            style={{ textDecoration: 'none' }}
            onClick={() =>
              trackHomeClick({
                module: 'hot_tags',
                targetType: 'tag',
                targetId: tag.id,
                targetTitle: tag.name
              })
            }
          >
            <TagBadge name={tag.name} />
          </Link>
        ))}
      </div>
    ) : (
      <Empty description="暂无标签数据" />
    )}
  </section>
);
