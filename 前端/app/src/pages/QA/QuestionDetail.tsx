import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { commentApi, questionApi } from '../../api';
import { CommentSection } from '../../components/Comment/CommentSection';
import { MarkdownRenderer, ShareButton } from '../../components/shared';
import { Card, Loading } from '../../components/ui';
import type { ContentItem } from '../../types/common';
import { extractData, extractList, getErrorMessage, mapCommentItem, trackHomeClick } from '../../utils';
import { AnswerItem } from './components/AnswerItem';
import { BountyBadge } from './components/BountyBadge';
import { SimilarQuestions } from './components/SimilarQuestions';
import { StatusBadge } from './components/StatusBadge';

const resolveStatus = (question: Record<string, unknown> | null): 'solved' | 'unsolved' | 'bounty' => {
  if (!question) {
    return 'unsolved';
  }

  if (question.isSolved === true) {
    return 'solved';
  }

  if (Number(question.bounty ?? 0) > 0) {
    return 'bounty';
  }

  return 'unsolved';
};

const QuestionDetailPage = () => {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [answers, setAnswers] = useState<ContentItem[]>([]);
  const [similar, setSimilar] = useState<string[]>([]);
  const [comments, setComments] = useState<ContentItem[]>([]);
  const viewTrackedKeyRef = useRef('');
  const isFromHome = searchParams.get('from') === 'home';

  const fetchComments = useCallback(async () => {
    if (!id) {
      setComments([]);
      return;
    }

    const response = await commentApi.list('question', id);
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
        const [detailRes, answerRes] = await Promise.all([questionApi.detail(id), questionApi.answers(id)]);
        const question = extractData<Record<string, unknown> | null>(detailRes, null);
        const answerList = extractList<Record<string, unknown>>(answerRes).map((item) => ({
          id: String(item.id ?? ''),
          content: String(item.content ?? item.contentHtml ?? ''),
          likes: Number(item.voteCount ?? 0),
          author:
            typeof item.author === 'object' && item.author
              ? {
                  id: String((item.author as { id?: string }).id ?? ''),
                  username: String(
                    (item.author as { nickname?: string; username?: string }).nickname ??
                      (item.author as { username?: string }).username ??
                      '匿名用户',
                  ),
                }
              : { id: '', username: '匿名用户' },
        }));

        setDetail(question);
        setAnswers(answerList.filter((item) => item.id));

        const title = String(question?.title ?? '').trim();
        if (title) {
          const similarRes = await questionApi.similar(title);
          const similarList = extractList<Record<string, unknown>>(similarRes)
            .map((item) => String(item.title ?? '').trim())
            .filter(Boolean)
            .filter((item) => item !== title)
            .slice(0, 6);

          setSimilar(similarList);
        } else {
          setSimilar([]);
        }

        await fetchComments();
      } catch (err) {
        setError(getErrorMessage(err, '问题详情加载失败'));
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
      targetType: 'question',
      targetId: id,
      targetTitle: String(detail.title ?? '')
    });
    viewTrackedKeyRef.current = id;
  }, [detail, id, isFromHome]);

  const status = useMemo(() => resolveStatus(detail), [detail]);

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
      {loading && <Loading text="问题详情加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {String(detail?.status ?? '') === 'pending' && (
        <div style={{ padding: '10px 16px', borderRadius: 8, fontSize: 14, background: 'var(--color-warningBg, #fff8e1)', color: 'var(--color-warning, #e65100)', border: '1px solid var(--color-warningBorder, #ffe0b2)' }}>
          该问题正在审核中，审核通过后将对所有人可见
        </div>
      )}
      <Card title={String(detail?.title ?? `问题详情 #${id}`)}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <StatusBadge status={status} />
          {Number(detail?.bounty ?? 0) > 0 && <BountyBadge amount={Number(detail?.bounty ?? 0)} />}
        </div>
        <MarkdownRenderer content={String(detail?.content ?? detail?.contentHtml ?? '')} />
        <div className="button-row" style={{ marginTop: 12 }}>
          <ShareButton
            title={String(detail?.title ?? '')}
            summary={String(detail?.summary ?? detail?.content ?? detail?.contentHtml ?? '')}
            contentType="问答问题"
          />
        </div>
      </Card>
      <Card title="解答列表">
        <div style={{ display: 'grid', gap: 10 }}>
          {answers.map((answer) => (
            <AnswerItem key={answer.id} answer={answer} />
          ))}
        </div>
      </Card>
      <CommentSection
        contentLabel="解答"
        comments={comments}
        onCreate={async (payload) => {
          if (!id) {
            return false;
          }

          try {
            await commentApi.create({ targetType: 'question', targetId: id, ...payload });
            if (isFromHome) {
              trackHomeClick({
                module: 'detail_interaction',
                targetType: 'question',
                targetId: id,
                targetTitle: String(detail?.title ?? ''),
                action: 'comment_create'
              });
            }
            await fetchComments();
            return true;
          } catch (err) {
            setError(getErrorMessage(err, '发布解答失败'));
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
                targetType: 'question',
                targetId: id,
                targetTitle: String(detail?.title ?? ''),
                action: 'comment_like'
              });
            }
          } catch (err) {
            setError(getErrorMessage(err, '解答点赞失败'));
          }
        }}
        onReport={async (item, reason, description) => {
          try {
            await commentApi.report(item.id, reason, description);
          } catch (err) {
            setError(getErrorMessage(err, '解答举报失败'));
          }
        }}
      />
      <SimilarQuestions list={similar.length ? similar : ['暂无相似问题']} />
    </div>
  );
};

export default QuestionDetailPage;
