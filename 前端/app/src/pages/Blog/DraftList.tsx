import { useEffect, useState } from 'react';
import { blogApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { ContentList } from '../../components/shared';
import type { ContentItem } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';

const DraftListPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState<ContentItem[]>([]);

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await blogApi.drafts();
        const drafts = extractList<Record<string, unknown>>(response).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.title ?? '未命名草稿'),
          summary: String(item.summary ?? item.content ?? '').slice(0, 120),
          createdAt: String(item.updatedAt ?? item.createdAt ?? ''),
        }));

        setList(drafts.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '草稿列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDrafts();
  }, []);

  return (
    <Card title="草稿箱">
      {loading ? <Loading text="草稿加载中..." /> : <ContentList list={list} />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginTop: 12 }}>
          {error}
        </div>
      )}
    </Card>
  );
};

export default DraftListPage;
