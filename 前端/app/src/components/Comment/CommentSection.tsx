import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import type { ContentItem } from '../../types/common';
import { Button, Card, Modal } from '../ui';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';

interface CommentCreatePayload {
  content: string;
  parentId?: string;
  rootId?: string;
  replyToId?: string;
}

interface CommentSectionProps {
  comments?: ContentItem[];
  contentLabel?: string;
  onCreate?: (payload: CommentCreatePayload) => Promise<boolean> | boolean;
  onLike?: (item: ContentItem) => Promise<void> | void;
  onReport?: (item: ContentItem, reason: string, description?: string) => Promise<void> | void;
}

const normalizeReportReason = (input: string) => {
  const text = input.trim().toLowerCase();
  if (['spam', 'abuse', 'inappropriate', 'copyright', 'other'].includes(text)) {
    return text;
  }
  return 'other';
};

export const CommentSection = ({
  comments = [],
  contentLabel = '评论',
  onCreate,
  onLike,
  onReport,
}: CommentSectionProps) => {
  const [replyTarget, setReplyTarget] = useState<ContentItem | null>(null);
  const [reportTarget, setReportTarget] = useState<ContentItem | null>(null);
  const [reportReason, setReportReason] = useState('other');
  const [reportDescription, setReportDescription] = useState('');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedLabel = useMemo(() => {
    const text = contentLabel.trim();
    return text || '评论';
  }, [contentLabel]);

  const placeholder = useMemo(() => {
    if (!replyTarget) {
      return `输入${normalizedLabel}内容`;
    }

    return `回复 @${replyTarget.author?.username ?? '用户'}：`;
  }, [replyTarget, normalizedLabel]);

  const openReportModal = (item: ContentItem) => {
    setReportTarget(item);
    setReportReason('other');
    setReportDescription('');
  };

  const submitReport = () => {
    if (!reportTarget) {
      return;
    }

    const reason = normalizeReportReason(reportReason);
    const description = reason === 'other' ? reportDescription.trim() || undefined : undefined;
    void onReport?.(reportTarget, reason, description);
    setReportTarget(null);
  };

  return (
    <Card title={`${normalizedLabel} ${comments.length}`}>
      <div style={{ display: 'grid', gap: 12 }}>
        {isAuthenticated ? (
          <CommentInput
            placeholder={placeholder}
            submitText={replyTarget ? '发布回复' : `发布${normalizedLabel}`}
            onCancel={replyTarget ? () => setReplyTarget(null) : undefined}
            onSubmit={async (content) => {
              if (!onCreate) {
                return false;
              }

              const ok = await onCreate({
                content,
                parentId: replyTarget?.id,
                rootId: replyTarget?.rootId ?? replyTarget?.id,
                replyToId: replyTarget?.id,
              });

              if (ok) {
                setReplyTarget(null);
              }

              return ok;
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              border: '1px solid var(--c-border)',
              borderRadius: 12,
              background: 'var(--c-bg-soft)',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--c-text-2)' }}>登录后可发布{normalizedLabel}</span>
            <Button
              variant="outline"
              onClick={() => {
                navigate('/auth/login', { replace: false, state: { from: location.pathname } });
              }}
            >
              去登录
            </Button>
          </div>
        )}

        <CommentList
          list={comments}
          emptyDescription={`还没有${normalizedLabel}，欢迎抢先发言`}
          interactionDisabled={!isAuthenticated}
          onLike={(item) => {
            if (!isAuthenticated) {
              return;
            }

            void onLike?.(item);
          }}
          onReply={(item) => {
            if (!isAuthenticated) {
              return;
            }

            setReplyTarget(item);
          }}
          onReport={(item) => {
            if (!isAuthenticated || !user?.id) {
              return;
            }

            if (item.author?.id && item.author.id === user.id) {
              window.alert(`不能举报自己的${normalizedLabel}`);
              return;
            }

            openReportModal(item);
          }}
        />

        <Modal
          open={Boolean(reportTarget)}
          title={`举报${normalizedLabel}`}
          onClose={() => setReportTarget(null)}
          footer={(
            <div className="button-row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setReportTarget(null)}>
                取消
              </Button>
              <Button onClick={submitReport}>提交举报</Button>
            </div>
          )}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <select className="input" value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
              <option value="spam">垃圾信息</option>
              <option value="abuse">辱骂攻击</option>
              <option value="inappropriate">不当内容</option>
              <option value="copyright">侵权内容</option>
              <option value="other">其他</option>
            </select>
            {normalizeReportReason(reportReason) === 'other' && (
              <textarea
                className="textarea"
                rows={4}
                placeholder="请补充举报说明（可选）"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
              />
            )}
          </div>
        </Modal>
      </div>
    </Card>
  );
};
