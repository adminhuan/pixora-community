import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { commentApi, projectApi } from '../../api';
import { useAuth } from '../../hooks';
import { FavoriteButton, LikeButton, ShareButton } from '../../components/shared';
import { Button, Card, Loading } from '../../components/ui';
import { CommentSection } from '../../components/Comment/CommentSection';
import type { ContentItem } from '../../types/common';
import { extractData, extractList, getErrorMessage, mapCommentItem } from '../../utils';
import { DemoButton } from './components/DemoButton';
import { ProjectStatus } from './components/ProjectStatus';
import { normalizeProjectStatus } from './constants/project-status';
import { RatingStars } from './components/RatingStars';
import { ScreenshotGallery } from './components/ScreenshotGallery';
import { TechStackTags } from './components/TechStackTags';

const ProjectDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [comments, setComments] = useState<ContentItem[]>([]);

  const fetchComments = useCallback(async () => {
    if (!id) {
      setComments([]);
      return;
    }

    const response = await commentApi.list('project', id);
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
        const response = await projectApi.detail(id);
        setDetail(extractData<Record<string, unknown> | null>(response, null));
        await fetchComments();
      } catch (err) {
        setError(getErrorMessage(err, '项目详情加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [fetchComments, id]);

  const statusValue = normalizeProjectStatus(detail?.status);

  const galleryImages = useMemo(() => {
    const coverImage = String(detail?.coverImage ?? '').trim();
    const screenshots = Array.isArray(detail?.screenshots) ? (detail.screenshots as unknown[]) : [];
    const merged = [coverImage, ...screenshots.map((item) => String(item ?? '').trim())]
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return Array.from(new Set(merged));
  }, [detail]);

  const authorId = useMemo(() => {
    if (!detail?.author || typeof detail.author !== 'object') {
      return '';
    }
    return String((detail.author as { id?: string }).id ?? '').trim();
  }, [detail]);

  const canEdit = Boolean(user?.id && (user.role === 'admin' || (authorId && user.id === authorId)));

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
      {loading && <Loading text="项目详情加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      <Card title={String(detail?.name ?? `项目详情 #${id}`)}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <ProjectStatus status={statusValue} />
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/projects/${id}/edit`)}>
                编辑项目（可改状态）
              </Button>
            )}
          </div>

          <TechStackTags stacks={Array.isArray(detail?.techStack) ? (detail?.techStack as string[]) : []} />

          {galleryImages.length > 0 ? (
            <ScreenshotGallery images={galleryImages} />
          ) : (
            <div
              style={{
                border: '1px dashed var(--color-border)',
                borderRadius: 10,
                padding: '16px 14px',
                color: 'var(--color-textSecondary)',
                background: 'var(--color-primaryBg)',
                fontSize: 13,
              }}
            >
              暂无项目图片，可点击右上角“编辑项目（可改状态）”补充封面。
            </div>
          )}

          <div className="button-row">
            <DemoButton url={String(detail?.demoUrl ?? '')} />
            <LikeButton
              count={Number(detail?.likeCount ?? 0)}
              onToggle={() => {
                if (id) {
                  void projectApi.like(id);
                }
              }}
            />
            <FavoriteButton
              count={Number(detail?.favoriteCount ?? 0)}
              onToggle={() => {
                if (id) {
                  void projectApi.favorite(id);
                }
              }}
            />
            <ShareButton
              title={String(detail?.name ?? detail?.title ?? '')}
              summary={String(detail?.description ?? detail?.content ?? '')}
              contentType="项目展示"
            />
          </div>
          <div>
            <strong>项目评分：</strong>
            <RatingStars
              value={Number(detail?.score ?? 0)}
              onChange={(score) => {
                if (id) {
                  void projectApi.rate(id, score);
                }
              }}
            />
          </div>
          <p style={{ margin: 0, lineHeight: 1.8 }}>{String(detail?.content ?? detail?.description ?? '')}</p>
        </div>
      </Card>
      <CommentSection
        contentLabel="反馈"
        comments={comments}
        onCreate={async (payload) => {
          if (!id) {
            return false;
          }

          try {
            await commentApi.create({ targetType: 'project', targetId: id, ...payload });
            await fetchComments();
            return true;
          } catch (err) {
            setError(getErrorMessage(err, '发布反馈失败'));
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
            setError(getErrorMessage(err, '反馈点赞失败'));
          }
        }}
        onReport={async (item, reason, description) => {
          try {
            await commentApi.report(item.id, reason, description);
          } catch (err) {
            setError(getErrorMessage(err, '反馈举报失败'));
          }
        }}
      />
    </div>
  );
};

export default ProjectDetailPage;
