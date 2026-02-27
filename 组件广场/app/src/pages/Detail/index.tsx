import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, Star, Share2, Copy, Check, Eye, Edit, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { snippetApi } from '../../api';
import { Button, Loading } from '../../components/ui';
import { ComponentPreview } from '../../components/shared/ComponentPreview';
import { CodeBlock } from '../../components/shared/CodeBlock';
import { extractData, getErrorMessage } from '../../utils/api';
import { formatNumber, relativeTime } from '../../utils/format';
import { useAuth, useCopyToClipboard } from '../../hooks';
import type { Snippet } from '../../types/common';

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { copied, copy } = useCopyToClipboard();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await snippetApi.detail(id);
        const data = extractData<Snippet>(res, null as unknown as Snippet);
        setSnippet(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const res = await snippetApi.like(id!);
      const result = extractData<{ liked: boolean }>(res, { liked: true });
      setSnippet((prev) =>
        prev ? {
          ...prev,
          isLiked: result.liked,
          likeCount: prev.likeCount + (result.liked ? 1 : -1),
        } : prev,
      );
    } catch { /* ignore */ }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const res = await snippetApi.favorite(id!);
      const result = extractData<{ favorited: boolean }>(res, { favorited: true });
      setSnippet((prev) =>
        prev ? {
          ...prev,
          isFavorited: result.favorited,
          favoriteCount: prev.favoriteCount + (result.favorited ? 1 : -1),
        } : prev,
      );
    } catch { /* ignore */ }
  };


  const handleCopyAll = () => {
    if (!snippet) return;
    const allCode = snippet.files
      .map((f) => `/* --- ${f.filename} --- */\n${f.content}`)
      .join('\n\n');
    copy(allCode);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) return <Loading />;
  if (error || !snippet) {
    return <div className="cp-error">{error || '组件不存在'}</div>;
  }

  const isOwner = user?.id === snippet.authorId;
  const currentHost = window.location.host || 'pixora.vip';

  return (
    <div className="cp-detail">
      <div className="cp-detail-header">
        <div className="cp-detail-title-row">
          <h1 className="cp-detail-title">{snippet.title}</h1>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/edit/${snippet.id}`)}>
              <Edit size={14} /> 编辑
            </Button>
          )}
        </div>
        {snippet.description && (
          <p className="cp-detail-desc">{snippet.description}</p>
        )}
        <div className="cp-detail-meta">
          <Link to={`/user/${snippet.authorId}`} className="cp-detail-author">
            {snippet.author.username}
          </Link>
          <span className="cp-detail-time">{relativeTime(snippet.createdAt)}</span>
          {snippet.category && <span className="cp-detail-badge">{snippet.category}</span>}
          <span className="cp-detail-badge">{snippet.framework}</span>
          <span className="cp-detail-stat"><Eye size={12} /> {formatNumber(snippet.viewCount)}</span>
        </div>
        {snippet.tags.length > 0 && (
          <div className="cp-detail-tags">
            {snippet.tags.map((t) => (
              <span key={t.tagId} className="cp-tag">{t.tag.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="cp-detail-split">
        <div className="cp-browser-window">
          <div className="cp-browser-toolbar">
            <div className="cp-browser-dots">
              <span className="cp-dot cp-dot--red" />
              <span className="cp-dot cp-dot--yellow" />
              <span className="cp-dot cp-dot--green" />
            </div>
            <div className="cp-browser-nav">
              <ChevronLeft size={16} />
              <ChevronRight size={16} />
            </div>
            <div className="cp-browser-url">
              <Search size={10} />
              <span>{currentHost}</span>
            </div>
          </div>
          <div className="cp-browser-body">
            <ComponentPreview files={snippet.files} height={500} framework={snippet.framework} lazy={false} />
          </div>
        </div>

        <div className="cp-detail-code">
          <CodeBlock
            files={snippet.files.map((f) => ({ filename: f.filename, language: f.language, code: f.content }))}
            maxHeight={520}
          />
        </div>
      </div>

      <div className="cp-detail-actions">
        <button type="button" className={`cp-action-btn${snippet.isLiked ? ' active' : ''}`} onClick={handleLike}>
          <Heart size={16} fill={snippet.isLiked ? 'currentColor' : 'none'} /> {formatNumber(snippet.likeCount)}
        </button>
        <button type="button" className={`cp-action-btn${snippet.isFavorited ? ' active' : ''}`} onClick={handleFavorite}>
          <Star size={16} fill={snippet.isFavorited ? 'currentColor' : 'none'} /> {formatNumber(snippet.favoriteCount)}
        </button>
<button type="button" className="cp-action-btn" onClick={handleShare}>
          <Share2 size={16} /> 分享
        </button>
        <button type="button" className="cp-action-btn cp-action-btn--primary" onClick={handleCopyAll}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? '已复制' : '复制全部代码'}
        </button>
      </div>
    </div>
  );
};

export default DetailPage;
