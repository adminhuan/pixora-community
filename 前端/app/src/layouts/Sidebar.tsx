import { useEffect, useState } from 'react';
import { Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tagApi } from '../api';
import { TagBadge } from '../components/Tag/TagBadge';
import { extractList, getErrorMessage, trackHomeClick } from '../utils';
import { TechToolVote } from '../pages/Home/TechToolVote';

interface HotTag {
  id: string;
  name: string;
}

export const Sidebar = () => {
  const [hotTags, setHotTags] = useState<HotTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const tagsRes = await tagApi.hot();

        const tags = extractList<Record<string, unknown>>(tagsRes)
          .map((item) => ({
            id: String(item.id ?? '').trim(),
            name: String(item.name ?? item.label ?? '').trim()
          }))
          .filter((item) => item.id && item.name)
          .slice(0, 8);

        if (!active) {
          return;
        }

        setHotTags(tags);
      } catch (err) {
        if (!active) {
          return;
        }
        setHotTags([]);
        setError(getErrorMessage(err, '侧栏数据加载失败'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="sidebar">
      <TechToolVote variant="sidebar" />

      <section className="sidebar-section">
        <header className="sidebar-header">
          <h4 className="sidebar-title">
            <Hash size={15} /> 热门标签
          </h4>
          <span className="sidebar-extra">趋势更新</span>
        </header>
        <div className="apc-tag-cloud">
          {hotTags.length ? (
            hotTags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.id}?from=home`}
                style={{ textDecoration: 'none' }}
                onClick={() =>
                  trackHomeClick({
                    module: 'sidebar_tags',
                    targetType: 'tag',
                    targetId: tag.id,
                    targetTitle: tag.name
                  })
                }
              >
                <TagBadge name={tag.name} />
              </Link>
            ))
          ) : (
            <span className="sidebar-extra">{loading ? '标签加载中...' : '暂无标签数据'}</span>
          )}
        </div>
      </section>

      {error && (
        <section className="sidebar-section">
          <div role="alert" className="error-text">
            {error}
          </div>
        </section>
      )}
    </aside>
  );
};
