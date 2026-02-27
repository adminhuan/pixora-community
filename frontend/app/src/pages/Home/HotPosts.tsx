import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Empty } from '../../components/ui';
import { trackHomeClick } from '../../utils';

interface HotPostsProps {
  posts: Array<{
    id: string;
    title: string;
  }>;
}

export const HotPosts = ({ posts }: HotPostsProps) => (
  <section className="home-section animate-fade-in">
    <header className="home-section-header">
      <h3 className="home-section-title">
        <span className="home-section-icon home-section-icon--fire"><Flame size={16} /></span>
        热门帖子
      </h3>
      <span className="home-section-extra">实时热度</span>
    </header>
    {posts.length ? (
      <ul className="home-list stagger">
        {posts.map((post, index) => (
          <li key={post.id} className="home-list-item">
            <span className={`home-list-rank ${index < 3 ? 'home-list-rank--top' : ''}`}>
              {index + 1}
            </span>
            <Link
              to={`/forum/${post.id}?from=home`}
              className="home-list-text"
              title={post.title}
              onClick={() =>
                trackHomeClick({
                  module: 'hot_posts',
                  targetType: 'post',
                  targetId: post.id,
                  targetTitle: post.title
                })
              }
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <Empty description="暂无帖子数据" />
    )}
  </section>
);
