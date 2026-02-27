import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { ContentList } from '../../components/shared';
import type { ContentItem } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';

const favoriteTypeLabelMap: Record<string, string> = {
  post: '帖子',
  blog: '博客',
  project: '项目',
  snippet: '代码',
  question: '问题',
  answer: '回答',
  comment: '评论',
};

const buildPathByType = (targetType: string, targetId: string) => {
  if (!targetId) {
    return '';
  }

  if (targetType === 'post') {
    return `/forum/${targetId}`;
  }
  if (targetType === 'blog') {
    return `/blog/${targetId}`;
  }
  if (targetType === 'project') {
    return `/projects/${targetId}`;
  }
  if (targetType === 'snippet') {
    return `/code/${targetId}`;
  }
  if (targetType === 'question') {
    return `/qa/${targetId}`;
  }

  return '';
};

const UserFavoritesPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState<ContentItem[]>([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await userApi.favorites(id);
        const favorites = extractList<Record<string, unknown>>(response).map((item) => {
          const folder = typeof item.folder === 'object' && item.folder ? (item.folder as Record<string, unknown>) : null;
          const targetType = String(item.targetType ?? '').trim();
          const targetId = String(item.targetId ?? '').trim();
          const typeLabel = favoriteTypeLabelMap[targetType] ?? '内容';

          const title =
            String(item.targetTitle ?? item.title ?? '').trim() ||
            `${typeLabel} #${targetId.slice(0, 8)}`;

          const summary =
            String(item.targetSummary ?? '').trim() ||
            `收藏夹：${String(folder?.name ?? '未命名收藏夹')}`;

          const targetAuthor =
            item.targetAuthor && typeof item.targetAuthor === 'object'
              ? (item.targetAuthor as { id?: string; username?: string; nickname?: string; avatar?: string })
              : null;

          const targetPath = String(item.targetPath ?? '').trim();
          const href = targetPath || buildPathByType(targetType, targetId);

          return {
            id: String(item.id ?? ''),
            title,
            summary,
            createdAt: String(item.targetCreatedAt ?? item.createdAt ?? ''),
            href: href || undefined,
            author:
              targetAuthor && targetAuthor.id
                ? {
                    id: String(targetAuthor.id),
                    username: String(targetAuthor.nickname ?? targetAuthor.username ?? '匿名用户'),
                    avatar: String(targetAuthor.avatar ?? ''),
                  }
                : undefined,
          };
        });

        setList(favorites.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '收藏列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchFavorites();
  }, [id]);

  return (
    <Card title="我的收藏夹">
      {loading ? <Loading text="收藏加载中..." /> : <ContentList list={list} />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginTop: 12 }}>
          {error}
        </div>
      )}
    </Card>
  );
};

export default UserFavoritesPage;
