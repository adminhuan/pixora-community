import { Suspense, lazy, type ReactElement } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { AdminAuthGuard } from '../layouts/AdminAuthGuard';
import { AdminLayout } from '../layouts/AdminLayout';

/* ---- lazy imports ---- */

// Dashboard
const DashboardPage = lazy(() => import('../pages/Dashboard'));

// Users
const UserListPage = lazy(() => import('../pages/Users/UserList'));
const RoleManagementPage = lazy(() => import('../pages/Users/RoleManagement'));
const UserDetailPage = lazy(() => import('../pages/Users/UserDetail'));
const UserEditPage = lazy(() => import('../pages/Users/UserEdit'));

// Audit
const AuditQueuePage = lazy(() => import('../pages/Audit/AuditQueue'));
const AuditHistoryPage = lazy(() => import('../pages/Audit/AuditHistory'));
const SensitiveWordsPage = lazy(() => import('../pages/Audit/SensitiveWords'));
const BlacklistManagePage = lazy(() => import('../pages/Audit/BlacklistManage'));

// Forum
const PostManagePage = lazy(() => import('../pages/ForumAdmin/PostManagePage'));
const ForumCommentPage = lazy(() => import('../pages/ForumAdmin/ForumCommentPage'));
const ForumBoardsPage = lazy(() => import('../pages/ForumAdmin/CategoryManage'));
const PostDetailPage = lazy(() => import('../pages/ForumAdmin/PostDetail'));

// QA
const QuestionManagePage = lazy(() => import('../pages/QAAdmin/QuestionManagePage'));
const QAAnswerManagePage = lazy(() => import('../pages/QAAdmin/AnswerManage'));
const QACommentPage = lazy(() => import('../pages/QAAdmin/QACommentPage'));
const BountyManagePage = lazy(() => import('../pages/QAAdmin/BountyManage'));

// Blog
const ArticleManagePage = lazy(() => import('../pages/BlogAdmin/ArticleManagePage'));
const BlogCommentPage = lazy(() => import('../pages/BlogAdmin/BlogCommentPage'));
const SeriesManagePage = lazy(() => import('../pages/BlogAdmin/SeriesManage'));
const BlogCategoryManagePage = lazy(() => import('../pages/BlogAdmin/BlogCategoryManage'));

// Projects
const ProjectListPage = lazy(() => import('../pages/ProjectAdmin/ProjectListPage'));
const ProjectCommentPage = lazy(() => import('../pages/ProjectAdmin/ProjectCommentPage'));
const ProjectCategoryManagePage = lazy(() => import('../pages/ProjectAdmin/ProjectCategoryManage'));

// Components
const ComponentManagePage = lazy(() => import('../pages/ComponentAdmin/ComponentManage'));
const ComponentRecommendPage = lazy(() => import('../pages/ComponentAdmin/ComponentRecommend'));

// Tags
const TagManagePage = lazy(() => import('../pages/TagAdmin/TagManage'));
const CategoryTreeManagePage = lazy(() => import('../pages/TagAdmin/CategoryTreeManage'));
const CategoryApplicationReviewPage = lazy(() => import('../pages/TagAdmin/CategoryApplicationReview'));
const TagStatsPage = lazy(() => import('../pages/TagAdmin/TagStats'));

// Analytics
const DataOverviewPage = lazy(() => import('../pages/Analytics/DataOverview'));
const PrivateMessageMonitorPage = lazy(() => import('../pages/Analytics/PrivateMessageMonitor'));
const UserAnalyticsPage = lazy(() => import('../pages/Analytics/UserAnalytics'));
const ContentAnalyticsPage = lazy(() => import('../pages/Analytics/ContentAnalytics'));
const InteractionAnalyticsPage = lazy(() => import('../pages/Analytics/InteractionAnalytics'));
const TrafficAnalyticsPage = lazy(() => import('../pages/Analytics/TrafficAnalytics'));
const ReportExportPage = lazy(() => import('../pages/Analytics/ReportExport'));

// Settings
const SiteSettingsPage = lazy(() => import('../pages/Settings/SiteSettings'));
const FeatureSettingsPage = lazy(() => import('../pages/Settings/FeatureSettings'));
const ContentSettingsPage = lazy(() => import('../pages/Settings/ContentSettings'));
const SecuritySettingsPage = lazy(() => import('../pages/Settings/SecuritySettings'));
const EmailSettingsPage = lazy(() => import('../pages/Settings/EmailSettings'));
const StorageSettingsPage = lazy(() => import('../pages/Settings/StorageSettings'));
const ModerationSettingsPage = lazy(() => import('../pages/Settings/ModerationSettings'));

// Operations
const AnnouncementManagePage = lazy(() => import('../pages/Operations/AnnouncementManage'));
const BannerManagePage = lazy(() => import('../pages/Operations/BannerManage'));
const RecommendManagePage = lazy(() => import('../pages/Operations/RecommendManage'));
const MassEmailPage = lazy(() => import('../pages/Operations/MassEmail'));
const OperationLogsPage = lazy(() => import('../pages/Operations/OperationLogs'));
const DataBackupPage = lazy(() => import('../pages/Operations/DataBackup'));
const SystemNotificationsPage = lazy(() => import('../pages/Operations/SystemNotifications'));
const PollManagePage = lazy(() => import('../pages/Operations/PollManage'));

// Auth
const AdminLoginPage = lazy(() => import('../pages/Auth/AdminLogin'));

/* ---- helpers ---- */

const withSuspense = (element: ReactElement) => (
  <Suspense fallback={<div style={{ padding: 24 }}>页面加载中...</div>}>{element}</Suspense>
);

const ModuleOutlet = () => <Outlet />;

const resolveAdminRouterBase = (): string => {
  if (typeof window === 'undefined') {
    return '/';
  }

  const pathname = String(window.location.pathname ?? '');
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return '/admin';
  }

  return '/';
};

/* ---- router ---- */

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<AdminLoginPage />) },
  {
    element: <AdminAuthGuard />,
    children: [
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/analytics/overview" replace /> },
          { path: 'dashboard', element: withSuspense(<DashboardPage />) },

          // 用户管理
          {
            path: 'users',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/users/list" replace /> },
              { path: 'list', element: withSuspense(<UserListPage />) },
              { path: 'roles', element: withSuspense(<RoleManagementPage />) },
              { path: ':id', element: withSuspense(<UserDetailPage />) },
              { path: ':id/edit', element: withSuspense(<UserEditPage />) },
            ],
          },

          // 内容审核
          {
            path: 'audit',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/audit/queue" replace /> },
              { path: 'queue', element: withSuspense(<AuditQueuePage />) },
              { path: 'history', element: withSuspense(<AuditHistoryPage />) },
              { path: 'sensitive-words', element: withSuspense(<SensitiveWordsPage />) },
              { path: 'blacklist', element: withSuspense(<BlacklistManagePage />) },
            ],
          },

          // 论坛管理
          {
            path: 'forum',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/forum/posts" replace /> },
              { path: 'posts', element: withSuspense(<PostManagePage />) },
              { path: 'posts/:id', element: withSuspense(<PostDetailPage />) },
              { path: 'comments', element: withSuspense(<ForumCommentPage />) },
              { path: 'boards', element: withSuspense(<ForumBoardsPage />) },
            ],
          },

          // 问答管理
          {
            path: 'qa',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/qa/questions" replace /> },
              { path: 'questions', element: withSuspense(<QuestionManagePage />) },
              { path: 'answers', element: withSuspense(<QAAnswerManagePage />) },
              { path: 'comments', element: withSuspense(<QACommentPage />) },
              { path: 'bounties', element: withSuspense(<BountyManagePage />) },
            ],
          },

          // 博客管理
          {
            path: 'blog',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/blog/articles" replace /> },
              { path: 'articles', element: withSuspense(<ArticleManagePage />) },
              { path: 'comments', element: withSuspense(<BlogCommentPage />) },
              { path: 'series', element: withSuspense(<SeriesManagePage />) },
              { path: 'categories', element: withSuspense(<BlogCategoryManagePage />) },
            ],
          },

          // 项目管理
          {
            path: 'projects',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/projects/list" replace /> },
              { path: 'list', element: withSuspense(<ProjectListPage />) },
              { path: 'comments', element: withSuspense(<ProjectCommentPage />) },
              { path: 'categories', element: withSuspense(<ProjectCategoryManagePage />) },
            ],
          },

          // 组件管理
          {
            path: 'components',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/components/list" replace /> },
              { path: 'list', element: withSuspense(<ComponentManagePage />) },
              { path: 'recommend', element: withSuspense(<ComponentRecommendPage />) },
            ],
          },

          // 标签管理
          {
            path: 'tags',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/tags/list" replace /> },
              { path: 'list', element: withSuspense(<TagManagePage />) },
              { path: 'tree', element: withSuspense(<CategoryTreeManagePage />) },
              { path: 'applications', element: withSuspense(<CategoryApplicationReviewPage />) },
              { path: 'stats', element: withSuspense(<TagStatsPage />) },
            ],
          },

          // 数据统计
          {
            path: 'analytics',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/analytics/overview" replace /> },
              { path: 'overview', element: withSuspense(<DataOverviewPage />) },
              { path: 'private-messages', element: withSuspense(<PrivateMessageMonitorPage />) },
              { path: 'users', element: withSuspense(<UserAnalyticsPage />) },
              { path: 'content', element: withSuspense(<ContentAnalyticsPage />) },
              { path: 'interaction', element: withSuspense(<InteractionAnalyticsPage />) },
              { path: 'traffic', element: withSuspense(<TrafficAnalyticsPage />) },
              { path: 'export', element: withSuspense(<ReportExportPage />) },
            ],
          },

          // 系统配置
          {
            path: 'settings',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/settings/site" replace /> },
              { path: 'site', element: withSuspense(<SiteSettingsPage />) },
              { path: 'features', element: withSuspense(<FeatureSettingsPage />) },
              { path: 'content', element: withSuspense(<ContentSettingsPage />) },
              { path: 'security', element: withSuspense(<SecuritySettingsPage />) },
              { path: 'email', element: withSuspense(<EmailSettingsPage />) },
              { path: 'storage', element: withSuspense(<StorageSettingsPage />) },
              { path: 'moderation', element: withSuspense(<ModerationSettingsPage />) },
            ],
          },

          // 运营工具
          {
            path: 'operations',
            element: <ModuleOutlet />,
            children: [
              { index: true, element: <Navigate to="/operations/announcements" replace /> },
              { path: 'announcements', element: withSuspense(<AnnouncementManagePage />) },
              { path: 'banners', element: withSuspense(<BannerManagePage />) },
              { path: 'recommend', element: withSuspense(<RecommendManagePage />) },
              { path: 'polls', element: withSuspense(<PollManagePage />) },
              { path: 'email', element: withSuspense(<MassEmailPage />) },
              { path: 'notifications', element: withSuspense(<SystemNotificationsPage />) },
              { path: 'logs', element: withSuspense(<OperationLogsPage />) },
              { path: 'backup', element: withSuspense(<DataBackupPage />) },
            ],
          },
        ],
      },
    ],
  },
], {
  basename: resolveAdminRouterBase(),
});
