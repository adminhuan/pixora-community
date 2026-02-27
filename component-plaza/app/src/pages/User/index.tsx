import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Heart } from 'lucide-react';
import { snippetApi } from '../../api';
import { Loading, Empty } from '../../components/ui';
import { ComponentPreview } from '../../components/shared/ComponentPreview';
import { extractData, extractList } from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useAuth } from '../../hooks';
import type { Snippet } from '../../types/common';
import clsx from 'classnames';

type Tab = 'works' | 'liked' | 'favorited';

const TABS: { key: Tab; label: string }[] = [
  { key: 'works', label: '作品' },
  { key: 'liked', label: '点赞' },
  { key: 'favorited', label: '收藏' },
];

const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('works');

  const isSelf = isAuthenticated && user?.id === id;

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { type: 'component', visibility: 'public', limit: 50 };
      if (tab === 'works') {
        params.authorId = id;
      } else if (tab === 'liked') {
        params.likedBy = id;
      } else if (tab === 'favorited') {
        params.favoritedBy = id;
      }
      const res = await snippetApi.list(params);
      setSnippets(extractList<Snippet>(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id, tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLike = async (snippetId: string) => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const res = await snippetApi.like(snippetId);
      const result = extractData<{ liked: boolean }>(res, { liked: true });
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? {
          ...s,
          isLiked: result.liked,
          likeCount: s.likeCount + (result.liked ? 1 : -1),
        } : s)),
      );
    } catch { /* ignore */ }
  };

  const visibleTabs = isSelf ? TABS : TABS.filter((t) => t.key === 'works');

  return (
    <div className="cp-user-page">
      <div className="cp-user-tabs">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={clsx('cp-user-tab', tab === t.key && 'active')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : snippets.length === 0 ? (
        <Empty description={
          tab === 'works' ? '还没有发布组件' :
          tab === 'liked' ? '还没有点赞的组件' :
          '还没有收藏的组件'
        } />
      ) : (
        <div className="cp-component-grid">
          {snippets.map((item) => (
            <div key={item.id} className="cp-component-card">
              <div className="cp-component-preview">
                <ComponentPreview files={item.files} height={220} framework={item.framework} />
                <button type="button" className="cp-preview-overlay" onClick={() => navigate(`/component/${item.id}`)} aria-label="查看详情">
                  <ExternalLink size={14} /> <span>详情</span>
                </button>
              </div>
              <div className="cp-component-info">
                <h3 className="cp-component-name" onClick={() => navigate(`/component/${item.id}`)} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/component/${item.id}`)}>
                  {item.title}
                </h3>
                <div className="cp-component-meta">
                  <span className="cp-meta-author" onClick={() => navigate(`/user/${item.authorId}`)}>{item.author.username}</span>
                  <button type="button" className={`cp-like-btn${item.isLiked ? ' active' : ''}`} onClick={() => handleLike(item.id)}>
                    <Heart size={13} fill={item.isLiked ? 'currentColor' : 'none'} /> {formatNumber(item.likeCount)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPage;
