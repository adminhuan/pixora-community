import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import HomePage from '../pages/Home';
import LoginPage from '../pages/Auth/Login';
import RegisterPage from '../pages/Auth/Register';
import ForgotPasswordPage from '../pages/Auth/ForgotPassword';
import ResetPasswordPage from '../pages/Auth/ResetPassword';
import OAuthCallbackPage from '../pages/Auth/OAuthCallback';
import ForumListPage from '../pages/Forum/ForumList';
import ForumDetailPage from '../pages/Forum/ForumDetail';
import CreatePostPage from '../pages/Forum/CreatePost';
import EditPostPage from '../pages/Forum/EditPost';
import CodeListPage from '../pages/Code/CodeList';
import CodeDetailPage from '../pages/Code/CodeDetail';
import CreateCodePage from '../pages/Code/CreateCode';
import EditCodePage from '../pages/Code/EditCode';
import QuestionListPage from '../pages/QA/QuestionList';
import QuestionDetailPage from '../pages/QA/QuestionDetail';
import AskQuestionPage from '../pages/QA/AskQuestion';
import EditQuestionPage from '../pages/QA/EditQuestion';
import ProjectListPage from '../pages/Projects/ProjectList';
import ProjectDetailPage from '../pages/Projects/ProjectDetail';
import CreateProjectPage from '../pages/Projects/CreateProject';
import EditProjectPage from '../pages/Projects/EditProject';
import BlogListPage from '../pages/Blog/BlogList';
import BlogDetailPage from '../pages/Blog/BlogDetail';
import WriteBlogPage from '../pages/Blog/WriteBlog';
import EditBlogPage from '../pages/Blog/EditBlog';
import DraftListPage from '../pages/Blog/DraftList';
import SeriesDetailPage from '../pages/Blog/SeriesDetail';
import UserProfilePage from '../pages/User/UserProfile';
import UserSettingsPage from '../pages/User/UserSettings';
import UserFollowersPage from '../pages/User/UserFollowers';
import UserFollowingPage from '../pages/User/UserFollowing';
import UserFavoritesPage from '../pages/User/UserFavorites';
import NotificationCenterPage from '../pages/Notifications/NotificationCenter';
import MessageCenterPage from '../pages/Messages/MessageCenter';
import SearchResultsPage from '../pages/Search/SearchResults';
import TagListPage from '../pages/Tags/TagList';
import TagDetailPage from '../pages/Tags/TagDetail';
import RankingPage from '../pages/Ranking/RankingPage';
import PointsDetailPage from '../pages/Points/PointsDetail';
import AchievementListPage from '../pages/Points/AchievementList';
import { AuthGuard } from '../utils/authGuard';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        element: <AuthGuard requireAuth={false} />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot', element: <ForgotPasswordPage /> },
          { path: 'reset', element: <ResetPasswordPage /> },
        ],
      },
      { path: 'callback', element: <OAuthCallbackPage /> },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'forum', element: <ForumListPage /> },
      { path: 'forum/:id', element: <ForumDetailPage /> },
      {
        element: <AuthGuard />,
        children: [
          { path: 'forum/create', element: <CreatePostPage /> },
          { path: 'forum/:id/edit', element: <EditPostPage /> },
          { path: 'code/create', element: <CreateCodePage /> },
          { path: 'code/:id/edit', element: <EditCodePage /> },
          { path: 'qa/ask', element: <AskQuestionPage /> },
          { path: 'qa/:id/edit', element: <EditQuestionPage /> },
          { path: 'projects/create', element: <CreateProjectPage /> },
          { path: 'projects/:id/edit', element: <EditProjectPage /> },
          { path: 'blog/write', element: <WriteBlogPage /> },
          { path: 'blog/:id/edit', element: <EditBlogPage /> },
          { path: 'blog/drafts', element: <DraftListPage /> },
          { path: 'messages', element: <MessageCenterPage /> },
          { path: 'settings', element: <UserSettingsPage /> },
        ],
      },
      { path: 'code', element: <CodeListPage /> },
      { path: 'code/:id', element: <CodeDetailPage /> },
      { path: 'qa', element: <QuestionListPage /> },
      { path: 'qa/:id', element: <QuestionDetailPage /> },
      { path: 'projects', element: <ProjectListPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'blog', element: <BlogListPage /> },
      { path: 'blog/:id', element: <BlogDetailPage /> },
      { path: 'series/:id', element: <SeriesDetailPage /> },
      { path: 'user/:id', element: <UserProfilePage /> },
      { path: 'user/:id/followers', element: <UserFollowersPage /> },
      { path: 'user/:id/following', element: <UserFollowingPage /> },
      { path: 'user/:id/favorites', element: <UserFavoritesPage /> },
      { path: 'notifications', element: <NotificationCenterPage /> },
      { path: 'search', element: <SearchResultsPage /> },
      { path: 'tags', element: <TagListPage /> },
      { path: 'tags/:id', element: <TagDetailPage /> },
      { path: 'ranking', element: <RankingPage /> },
      { path: 'points/:id', element: <PointsDetailPage /> },
      { path: 'achievements/:id', element: <AchievementListPage /> },
    ],
  },
]);
