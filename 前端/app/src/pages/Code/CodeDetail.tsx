import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { commentApi, snippetApi } from '../../api';
import { FavoriteButton, LikeButton, ShareButton, CodeBlock } from '../../components/shared';
import { Card, Loading } from '../../components/ui';
import { CommentSection } from '../../components/Comment/CommentSection';
import type { ContentItem } from '../../types/common';
import { extractData, extractList, getErrorMessage, mapCommentItem, trackHomeClick } from '../../utils';
import { ComponentPreview } from './components/ComponentPreview';

interface SnippetFile {
  id?: string;
  filename?: string;
  language?: string;
  content?: string;
}

const CodeDetailPage = () => {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [files, setFiles] = useState<SnippetFile[]>([]);
  const [comments, setComments] = useState<ContentItem[]>([]);
  const viewTrackedKeyRef = useRef('');
  const isFromHome = searchParams.get('from') === 'home';

  const fetchComments = useCallback(async () => {
    if (!id) {
      setComments([]);
      return;
    }

    const response = await commentApi.list('snippet', id);
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
        const response = await snippetApi.detail(id);
        const data = extractData<Record<string, unknown> | null>(response, null);
        const fileList = Array.isArray(data?.files) ? (data?.files as SnippetFile[]) : [];
        setDetail(data);
        setFiles(fileList);
        await fetchComments();
      } catch (err) {
        setError(getErrorMessage(err, '组件详情加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [fetchComments, id]);

  useEffect(() => {
    viewTrackedKeyRef.current = '';
  }, [id, isFromHome]);

  useEffect(() => {
    if (!id || !isFromHome || !detail) {
      return;
    }
    if (viewTrackedKeyRef.current === id) {
      return;
    }

    trackHomeClick({
      module: 'detail_view',
      targetType: 'snippet',
      targetId: id,
      targetTitle: String(detail.title ?? '')
    });
    viewTrackedKeyRef.current = id;
  }, [detail, id, isFromHome]);

  const htmlCode = useMemo(() => {
    const file = files.find((item) => item.language === 'html' || item.filename?.endsWith('.html'));
    return String(file?.content ?? '');
  }, [files]);

  const cssCode = useMemo(() => {
    const file = files.find((item) => item.language === 'css' || item.filename?.endsWith('.css'));
    return String(file?.content ?? '');
  }, [files]);

  const jsCode = useMemo(() => {
    const file = files.find((item) => item.language === 'javascript' || item.filename?.endsWith('.js'));
    return String(file?.content ?? '');
  }, [files]);

  const codeFiles = useMemo(
    () =>
      files.map((item) => ({
        filename: String(item.filename ?? 'untitled'),
        language: String(item.language ?? 'text'),
        code: String(item.content ?? ''),
      })),
    [files],
  );

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
    <div className="cg-detail">
      {loading && <Loading text="组件加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>{error}</div>
        </Card>
      )}

      {detail && (
        <>
          <h1 className="cg-detail-title">{String(detail.title ?? '组件详情')}</h1>

          <ComponentPreview html={htmlCode} css={cssCode} js={jsCode} interactive />

          {codeFiles.length > 0 && <CodeBlock files={codeFiles} />}

          <div className="button-row">
            <LikeButton
              count={Number(detail.likeCount ?? 0)}
              onToggle={() => {
                if (id) {
                  void snippetApi.like(id);
                  if (isFromHome) {
                    trackHomeClick({
                      module: 'detail_interaction',
                      targetType: 'snippet',
                      targetId: id,
                      targetTitle: String(detail?.title ?? ''),
                      action: 'like'
                    });
                  }
                }
              }}
            />
            <FavoriteButton
              count={Number(detail.favoriteCount ?? 0)}
              onToggle={() => {
                if (id) {
                  void snippetApi.favorite(id);
                  if (isFromHome) {
                    trackHomeClick({
                      module: 'detail_interaction',
                      targetType: 'snippet',
                      targetId: id,
                      targetTitle: String(detail?.title ?? ''),
                      action: 'favorite'
                    });
                  }
                }
              }}
            />
            <ShareButton
              title={String(detail?.title ?? detail?.name ?? '')}
              summary={String(detail?.description ?? detail?.content ?? '')}
              contentType="组件代码"
            />
          </div>
        </>
      )}

      <CommentSection
        contentLabel="交流"
        comments={comments}
        onCreate={async (payload) => {
          if (!id) {
            return false;
          }

          try {
            await commentApi.create({ targetType: 'snippet', targetId: id, ...payload });
            if (isFromHome) {
              trackHomeClick({
                module: 'detail_interaction',
                targetType: 'snippet',
                targetId: id,
                targetTitle: String(detail?.title ?? ''),
                action: 'comment_create'
              });
            }
            await fetchComments();
            return true;
          } catch (err) {
            setError(getErrorMessage(err, '发布交流失败'));
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
            if (isFromHome) {
              trackHomeClick({
                module: 'detail_interaction',
                targetType: 'snippet',
                targetId: id,
                targetTitle: String(detail?.title ?? ''),
                action: 'comment_like'
              });
            }
          } catch (err) {
            setError(getErrorMessage(err, '交流点赞失败'));
          }
        }}
        onReport={async (item, reason, description) => {
          try {
            await commentApi.report(item.id, reason, description);
          } catch (err) {
            setError(getErrorMessage(err, '交流举报失败'));
          }
        }}
      />
    </div>
  );
};

export default CodeDetailPage;
