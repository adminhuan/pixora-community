import { useMemo, useState } from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  SafetyOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  ProjectOutlined,
  TagsOutlined,
  BarChartOutlined,
  SettingOutlined,
  ToolOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

const items: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: '用户管理',
    children: [
      { key: '/users/list', label: '用户列表' },
      { key: '/users/roles', label: '角色管理' },
    ],
  },
  {
    key: '/audit',
    icon: <SafetyOutlined />,
    label: '内容审核',
    children: [
      { key: '/audit/queue', label: '审核队列' },
      { key: '/audit/history', label: '审核历史' },
      { key: '/audit/sensitive-words', label: '敏感词管理' },
      { key: '/audit/blacklist', label: '黑名单管理' },
    ],
  },
  {
    key: '/forum',
    icon: <MessageOutlined />,
    label: '论坛管理',
    children: [
      { key: '/forum/posts', label: '帖子管理' },
      { key: '/forum/comments', label: '评论管理' },
      { key: '/forum/boards', label: '板块管理' },
    ],
  },
  {
    key: '/qa',
    icon: <QuestionCircleOutlined />,
    label: '问答管理',
    children: [
      { key: '/qa/questions', label: '问题管理' },
      { key: '/qa/answers', label: '回答管理' },
      { key: '/qa/comments', label: '评论管理' },
      { key: '/qa/bounties', label: '悬赏管理' },
    ],
  },
  {
    key: '/blog',
    icon: <ReadOutlined />,
    label: '博客管理',
    children: [
      { key: '/blog/articles', label: '文章管理' },
      { key: '/blog/comments', label: '评论管理' },
      { key: '/blog/series', label: '系列管理' },
      { key: '/blog/categories', label: '分类管理' },
    ],
  },
  {
    key: '/projects',
    icon: <ProjectOutlined />,
    label: '项目管理',
    children: [
      { key: '/projects/list', label: '项目列表' },
      { key: '/projects/comments', label: '评论管理' },
      { key: '/projects/categories', label: '分类管理' },
    ],
  },
  {
    key: '/components',
    icon: <AppstoreOutlined />,
    label: '组件管理',
    children: [
      { key: '/components/list', label: '组件列表' },
      { key: '/components/recommend', label: '推荐管理' },
    ],
  },
  {
    key: '/tags',
    icon: <TagsOutlined />,
    label: '标签管理',
    children: [
      { key: '/tags/list', label: '标签列表' },
      { key: '/tags/tree', label: '分类树管理' },
      { key: '/tags/applications', label: '分类申请' },
      { key: '/tags/stats', label: '标签统计' },
    ],
  },
  {
    key: '/analytics',
    icon: <BarChartOutlined />,
    label: '数据统计',
    children: [
      { key: '/analytics/overview', label: '数据总览' },
      { key: '/analytics/private-messages', label: '私信监控' },
      { key: '/analytics/users', label: '用户分析' },
      { key: '/analytics/content', label: '内容分析' },
      { key: '/analytics/interaction', label: '互动分析' },
      { key: '/analytics/traffic', label: '流量分析' },
      { key: '/analytics/export', label: '报表导出' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统配置',
    children: [
      { key: '/settings/site', label: '站点设置' },
      { key: '/settings/features', label: '功能开关' },
      { key: '/settings/content', label: '内容设置' },
      { key: '/settings/security', label: '安全设置' },
      { key: '/settings/email', label: '邮件配置' },
      { key: '/settings/storage', label: '存储配置' },
      { key: '/settings/moderation', label: '审核配置' },
    ],
  },
  {
    key: '/operations',
    icon: <ToolOutlined />,
    label: '运营工具',
    children: [
      { key: '/operations/announcements', label: '公告管理' },
      { key: '/operations/banners', label: 'Banner管理' },
      { key: '/operations/recommend', label: '推荐管理' },
      { key: '/operations/polls', label: '投票管理' },
      { key: '/operations/email', label: '群发邮件' },
      { key: '/operations/notifications', label: '系统通知' },
      { key: '/operations/logs', label: '操作日志' },
      { key: '/operations/backup', label: '数据备份' },
    ],
  },
];

const getOpenKeyFromPath = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : '';
};

const getSelectedKeyFromPath = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return `/${segments[0]}/${segments[1]}`;
  }
  if (segments.length === 1) {
    return `/${segments[0]}`;
  }
  return '/dashboard';
};

export const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultOpenKey = getOpenKeyFromPath(location.pathname);
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKey ? [defaultOpenKey] : []);

  const selectedKey = useMemo(() => getSelectedKeyFromPath(location.pathname), [location.pathname]);

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      items={items}
      onClick={({ key }) => navigate(String(key))}
      style={{ height: '100%', borderInlineEnd: 0 }}
    />
  );
};
