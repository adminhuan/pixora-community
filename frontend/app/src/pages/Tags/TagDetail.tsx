import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { tagApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { ContentList } from '../../components/shared';
import type { ContentItem } from '../../types/common';
import { extractData, extractList, getErrorMessage } from '../../utils';

const TagDetailPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagName, setTagName] = useState(id);
  const [list, setList] = useState<ContentItem[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [detailRes, contentRes] = await Promise.all([tagApi.detail(id), tagApi.contents(id)]);
        const detail = extractData<Record<string, unknown>>(detailRes, {});
        setTagName(String(detail.name ?? id));

        const contents = extractData<Record<string, unknown>>(contentRes, {});
        const mixed = Array.isArray(contents.items)
          ? (contents.items as Record<string, unknown>[])
          : [
              ...(Array.isArray(contents.posts) ? (contents.posts as Record<string, unknown>[]) : []),
              ...(Array.isArray(contents.blogs) ? (contents.blogs as Record<string, unknown>[]) : []),
              ...(Array.isArray(contents.questions) ? (contents.questions as Record<string, unknown>[]) : []),
              ...(Array.isArray(contents.projects) ? (contents.projects as Record<string, unknown>[]) : []),
              ...(Array.isArray(contents.snippets) ? (contents.snippets as Record<string, unknown>[]) : []),
            ];

        const parsed = (mixed.length ? mixed : extractList<Record<string, unknown>>(contentRes)).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.title ?? item.name ?? '未命名内容'),
          summary: String(item.summary ?? item.description ?? item.content ?? '').slice(0, 120),
        }));

        setList(parsed.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '标签详情加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [id]);

  return (
    <Card title={`标签详情：${tagName}`}>
      {loading && <Loading text="标签内容加载中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      {!loading && <ContentList list={list} />}
    </Card>
  );
};

export default TagDetailPage;
