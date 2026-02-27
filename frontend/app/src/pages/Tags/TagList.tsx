import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { tagApi } from '../../api';
import { Card, Empty, Loading } from '../../components/ui';
import { extractList, getErrorMessage } from '../../utils';
import { TagCloud } from './components/TagCloud';
import { TagStats } from './components/TagStats';

interface TagRecord {
  id: string;
  name: string;
  heat: number;
}

const TagListPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [hotTags, setHotTags] = useState<TagRecord[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError('');

      try {
        const [listRes, hotRes] = await Promise.all([
          tagApi.list({ page: 1, limit: 100 }),
          tagApi.hot(),
        ]);

        const allTags = extractList<Record<string, unknown>>(listRes).map((item) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? ''),
          heat: Number(item.followersCount ?? item.contentCount ?? item.postCount ?? 1),
        }));

        const hot = extractList<Record<string, unknown>>(hotRes).map((item) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? ''),
          heat: Number(item.followersCount ?? item.contentCount ?? 1),
        }));

        setTags(allTags.filter((item) => item.id && item.name));
        setHotTags(hot.filter((item) => item.id && item.name));
      } catch (err) {
        setError(getErrorMessage(err, '标签加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchTags();
  }, []);

  const cloudData = useMemo(() => {
    const source = hotTags.length ? hotTags : tags;
    return source.slice(0, 20).map((item) => ({
      name: item.name,
      heat: Math.max(1, Math.min(5, Math.ceil(item.heat / 10))),
    }));
  }, [hotTags, tags]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TagStats total={tags.length} followed={0} />
      {loading && <Loading text="标签加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {!loading && !tags.length && <Empty description="暂无标签数据" />}

      <Card title="标签云">
        <TagCloud tags={cloudData} />
      </Card>
      <Card title="标签列表">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {tags.map((tag) => (
            <Link key={tag.id} to={`/tags/${tag.id}`}>
              {tag.name}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TagListPage;
