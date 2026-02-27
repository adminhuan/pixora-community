import { Breadcrumb } from 'antd';
import { useLocation } from 'react-router-dom';

const titleMap: Record<string, string> = {
  // 一级
  dashboard: '仪表盘',
  users: '用户管理',
  audit: '内容审核',
  forum: '论坛管理',
  qa: '问答管理',
  blog: '博客管理',
  projects: '项目管理',
  components: '组件管理',
  tags: '标签管理',
  analytics: '数据统计',
  settings: '系统配置',
  operations: '运营工具',

  // 用户管理
  'users/list': '用户列表',
  'users/roles': '角色管理',

  // 内容审核
  'audit/queue': '审核队列',
  'audit/history': '审核历史',
  'audit/sensitive-words': '敏感词管理',
  'audit/blacklist': '黑名单管理',

  // 论坛管理
  'forum/posts': '帖子管理',
  'forum/comments': '评论管理',
  'forum/boards': '板块管理',

  // 问答管理
  'qa/questions': '问题管理',
  'qa/answers': '回答管理',
  'qa/comments': '评论管理',
  'qa/bounties': '悬赏管理',

  // 博客管理
  'blog/articles': '文章管理',
  'blog/comments': '评论管理',
  'blog/series': '系列管理',
  'blog/categories': '分类管理',

  // 项目管理
  'projects/list': '项目列表',
  'projects/comments': '评论管理',
  'projects/categories': '分类管理',

  // 组件管理
  'components/list': '组件列表',
  'components/recommend': '推荐管理',

  // 标签管理
  'tags/list': '标签列表',
  'tags/tree': '分类树管理',
  'tags/applications': '分类申请',
  'tags/stats': '标签统计',

  // 数据统计
  'analytics/overview': '数据总览',
  'analytics/private-messages': '私信监控',
  'analytics/users': '用户分析',
  'analytics/content': '内容分析',
  'analytics/interaction': '互动分析',
  'analytics/traffic': '流量分析',
  'analytics/export': '报表导出',

  // 系统配置
  'settings/site': '站点设置',
  'settings/features': '功能开关',
  'settings/content': '内容设置',
  'settings/security': '安全设置',
  'settings/email': '邮件配置',
  'settings/storage': '存储配置',

  // 运营工具
  'operations/announcements': '公告管理',
  'operations/banners': 'Banner管理',
  'operations/recommend': '推荐管理',
  'operations/polls': '投票管理',
  'operations/email': '群发邮件',
  'operations/notifications': '系统通知',
  'operations/logs': '操作日志',
  'operations/backup': '数据备份',
};

export const AdminBreadcrumb = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const items: Array<{ title: string }> = [{ title: '后台' }];

  if (segments.length >= 1) {
    items.push({ title: titleMap[segments[0]] ?? segments[0] });
  }

  if (segments.length >= 2) {
    const fullKey = `${segments[0]}/${segments[1]}`;
    const label = titleMap[fullKey];
    if (label) {
      items.push({ title: label });
    }
  }

  return <Breadcrumb items={items} style={{ marginBottom: 12 }} />;
};
