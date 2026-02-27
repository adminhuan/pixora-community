import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { useAuth } from '../../hooks';
import { ContentList } from '../../components/shared';
import type { ContentItem, UserBrief } from '../../types/common';
import { extractData, extractList, getErrorMessage } from '../../utils';
import { AchievementBadges } from './components/AchievementBadges';
import { ContentTabs } from './components/ContentTabs';
import { ContributionGraph } from './components/ContributionGraph';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileStats } from './components/ProfileStats';

type ContentTabKey = 'posts' | 'answers' | 'blogs' | 'snippets' | 'projects' | 'favorites';

const contentRequestMap: Record<ContentTabKey, (id: string) => Promise<unknown>> = {
  posts: (id) => userApi.posts(id),
  answers: (id) => userApi.answers(id),
  blogs: (id) => userApi.blogs(id),
  snippets: (id) => userApi.snippets(id),
  projects: (id) => userApi.projects(id),
  favorites: (id) => userApi.favorites(id),
};

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

const resolveAuthor = (input: unknown): UserBrief | undefined => {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const raw = input as { id?: string; username?: string; nickname?: string; avatar?: string };
  const id = String(raw.id ?? '').trim();
  const username = String(raw.nickname ?? raw.username ?? '').trim();

  if (!id || !username) {
    return undefined;
  }

  return {
    id,
    username,
    avatar: String(raw.avatar ?? '').trim() || undefined,
  };
};

const mapToContentItem = (item: Record<string, unknown>, tab: ContentTabKey): ContentItem => {
  const id = String(item.id ?? '').trim();
  const targetType = String(item.targetType ?? '').trim();
  const targetId = String(item.targetId ?? '').trim();
  const targetPath = String(item.targetPath ?? '').trim();
  const questionId = String(item.questionId ?? '').trim();
  const fallbackTypeLabel = favoriteTypeLabelMap[targetType] ?? '内容';

  const fallbackTitle =
    tab === 'answers' ? '我的回答' : tab === 'favorites' ? `${fallbackTypeLabel} #${targetId.slice(0, 8)}` : '未命名内容';

  const title = String(item.targetTitle ?? item.title ?? item.name ?? item.action ?? fallbackTitle).trim() || fallbackTitle;

  const summaryText = String(item.targetSummary ?? item.summary ?? item.description ?? item.content ?? '').trim();
  const folder = item.folder && typeof item.folder === 'object' ? (item.folder as { name?: string }) : null;
  const summary = summaryText || (tab === 'favorites' ? `收藏夹：${String(folder?.name ?? '未命名收藏夹')}` : '暂无简介');

  const createdAt = String(item.targetCreatedAt ?? item.createdAt ?? '').trim();
  const author = resolveAuthor(item.targetAuthor) ?? resolveAuthor(item.author);

  let href = '';

  if (tab === 'posts') {
    href = id ? `/forum/${id}` : '';
  } else if (tab === 'blogs') {
    href = id ? `/blog/${id}` : '';
  } else if (tab === 'projects') {
    href = id ? `/projects/${id}` : '';
  } else if (tab === 'snippets') {
    href = id ? `/code/${id}` : '';
  } else if (tab === 'answers') {
    href = questionId ? `/qa/${questionId}#answer-${id}` : '';
  } else if (tab === 'favorites') {
    href = targetPath || buildPathByType(targetType, targetId);
  }

  return {
    id,
    title,
    summary: summary.slice(0, 120),
    createdAt,
    author,
    targetType,
    targetId,
    href: href || undefined,
  };
};

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<ContentTabKey>('posts');
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [contributions, setContributions] = useState<Array<{ date: string; count: number }>>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [contentList, setContentList] = useState<ContentItem[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const [profileRes, contributionRes, achievementRes] = await Promise.all([
          userApi.profile(id),
          userApi.contributions(id),
          userApi.achievements(id),
        ]);

        const profileData = extractData<Record<string, unknown> | null>(profileRes, null);
        setProfile(profileData);

        const contributionList = extractList<Record<string, unknown>>(contributionRes).map((item) => ({
          date: String(item.date ?? ''),
          count: Math.max(0, Number(item.count ?? 0)),
        }));
        setContributions(contributionList);

        const achievementList = extractList<Record<string, unknown>>(achievementRes)
          .map((item) => {
            const achievement = item.achievement as { name?: string } | undefined;
            return String(achievement?.name ?? item.name ?? '').trim();
          })
          .filter(Boolean);
        setAchievements(achievementList);
      } catch (err) {
        setError(getErrorMessage(err, '用户信息加载失败'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchProfile();
    }
  }, [id]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        return;
      }

      setContentLoading(true);

      try {
        const response = await contentRequestMap[activeTab](id);
        const list = extractList<Record<string, unknown>>(response)
          .map((item) => mapToContentItem(item, activeTab))
          .filter((item) => item.id);
        setContentList(list);
      } catch {
        setContentList([]);
      } finally {
        setContentLoading(false);
      }
    };

    void fetchContent();
  }, [activeTab, id]);

  const stats = useMemo(() => {
    return [
      { label: '帖子', value: Number(profile?.postsCount ?? 0) },
      { label: '回答', value: Number(profile?.answersCount ?? 0) },
      { label: '博客', value: Number(profile?.blogsCount ?? 0) },
      { label: '项目', value: Number(profile?.projectsCount ?? 0) },
      { label: '积分', value: Number(profile?.points ?? 0) },
      { label: '粉丝', value: Number(profile?.followersCount ?? 0) },
    ];
  }, [profile]);

  const profileUserId = String(profile?.id ?? '').trim();
  const canSendMessage =
    isAuthenticated && Boolean(profileUserId) && Boolean(currentUser?.id) && profileUserId !== currentUser?.id;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {loading && <Loading text="用户资料加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      <ProfileHeader
        username={String(profile?.username ?? `用户${id}`)}
        bio={String(profile?.bio ?? '')}
        onMessage={
          canSendMessage
            ? () => {
                navigate(`/messages?userId=${profileUserId}`);
              }
            : undefined
        }
      />
      <ProfileStats stats={stats} />
      <ContributionGraph data={contributions} />
      <AchievementBadges list={achievements} />
      <Card title="内容列表">
        <div style={{ display: 'grid', gap: 12 }}>
          <ContentTabs active={activeTab} onChange={(key) => setActiveTab(key as ContentTabKey)} />
          {contentLoading ? <Loading text="内容加载中..." /> : <ContentList list={contentList} />}
        </div>
      </Card>
    </div>
  );
};

export default UserProfilePage;
