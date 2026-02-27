import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { blogApi, commentApi, seriesApi } from '../../api';
import { MarkdownRenderer } from '../../components/shared';
import { Card, Loading } from '../../components/ui';
import { CommentSection } from '../../components/Comment/CommentSection';
import type { ContentItem } from '../../types/common';
import { extractData, extractList, getErrorMessage, mapCommentItem } from '../../utils';
import { ArticleFooter } from './components/ArticleFooter';
import { ReadingProgress } from './components/ReadingProgress';
import { SeriesNav } from './components/SeriesNav';
import { TableOfContents } from './components/TableOfContents';

const extractHeadings = (markdown: string) => {
  const lines = markdown.split('\n');
  return lines
    .filter((line) => line.startsWith('## '))
    .map((line, index) => ({ id: `section-${index + 1}`, title: line.replace(/^##\s+/, '').trim() }))
    .filter((item) => item.title);
};

const BlogDetailPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [seriesItems, setSeriesItems] = useState<string[]>([]);
  const [comments, setComments] = useState<ContentItem[]>([]);

  const content = String(detail?.content ?? detail?.contentHtml ?? '');
  const headings = useMemo(() => extractHeadings(content), [content]);

  const fetchComments = useCallback(async () => {
    if (!id) {
      setComments([]);
      return;
    }

    const response = await commentApi.list('blog', id);
    const list = extractList<Record<string, unknown>>(response).map(mapCommentItem);
    setComments(list.filter((item) => item.id));
  }, [id]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await blogApi.detail(id);
        const data = extractData<Record<string, unknown> | null>(response, null);

        setDetail(data);

        const seriesId =
          typeof data?.series === 'object' && data.series
            ? String((data.series as { id?: string }).id ?? '')
            : String(data?.seriesId ?? '');

        if (seriesId) {
          const seriesRes = await seriesApi.detail(seriesId);
          const seriesData = extractData<Record<string, unknown> | null>(seriesRes, null);
          const blogs = Array.isArray(seriesData?.blogs) ? (seriesData?.blogs as Array<{ title?: string }>) : [];
          const names = blogs.map((item) => String(item.title ?? '').trim()).filter(Boolean);
          setSeriesItems(names);
        } else {
          setSeriesItems([]);
        }

        await fetchComments();
      } catch (err) {
        setError(getErrorMessage(err, '博客详情加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [fetchComments, id]);

  const patchCommentLike = (commentId: string, nextLikeCount: number) => {
    setComments((prev) =>
      prev.map((item) =>
        item.id === commentId
          ? {
              ...item,
              likeCount: nextLikeCount,
              likes: nextLikeCount,
            }
          : item,
      ),
    );
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {loading && <Loading text="博客详情加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {String(detail?.status ?? '') === 'pending' && (
        <div style={{ padding: '10px 16px', borderRadius: 8, fontSize: 14, background: 'var(--color-warningBg, #fff8e1)', color: 'var(--color-warning, #e65100)', border: '1px solid var(--color-warningBorder, #ffe0b2)' }}>
          该文章正在审核中，审核通过后将对所有人可见
        </div>
      )}
      <ReadingProgress progress={35} />
      <Card title={String(detail?.title ?? `博客详情 #${id}`)}>
        <div style={{ display: 'grid', gap: 14 }}>
          <MarkdownRenderer content={content} />
          <ArticleFooter
            title={String(detail?.title ?? '')}
            summary={String(detail?.summary ?? detail?.excerpt ?? content ?? '')}
          />
        </div>
      </Card>
      <Card title="目录">
        <TableOfContents headings={headings.length ? headings : [{ id: 'section-1', title: '正文' }]} />
      </Card>
      <Card title="系列文章">
        <SeriesNav
          series={
            seriesItems.length
              ? seriesItems
              : [String((detail?.series as { name?: string } | undefined)?.name ?? '暂无系列文章')]
          }
        />
      </Card>
      <CommentSection
        contentLabel="讨论"
        comments={comments}
        onCreate={async (payload) => {
          if (!id) {
            return false;
          }

          try {
            await commentApi.create({ targetType: 'blog', targetId: id, ...payload });
            await fetchComments();
            return true;
          } catch (err) {
            setError(getErrorMessage(err, '发布讨论失败'));
            return false;
          }
        }}
        onLike={async (item) => {
          try {
            const response = await commentApi.like(item.id);
            const data = extractData<Record<string, unknown> | null>(response, null);
            const likedComment =
              data?.comment && typeof data.comment === 'object'
                ? (data.comment as { likeCount?: number })
                : null;
            const nextLikeCount = Number(likedComment?.likeCount ?? item.likeCount ?? item.likes ?? 0);
            patchCommentLike(item.id, Number.isFinite(nextLikeCount) ? nextLikeCount : 0);
          } catch (err) {
            setError(getErrorMessage(err, '讨论点赞失败'));
          }
        }}
        onReport={async (item, reason, description) => {
          try {
            await commentApi.report(item.id, reason, description);
          } catch (err) {
            setError(getErrorMessage(err, '讨论举报失败'));
          }
        }}
      />
    </div>
  );
};

export default BlogDetailPage;
