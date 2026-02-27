import { request } from './request';

export const adminDashboardApi = {
  stats: () => request.get('/admin/dashboard/stats'),
  trends: () => request.get('/admin/dashboard/trends'),
  activity: () => request.get('/admin/dashboard/activity'),
  pending: () => request.get('/admin/dashboard/pending'),
  recentLogs: () => request.get('/admin/logs/recent'),
};

export const adminUserApi = {
  list: (params?: Record<string, unknown>) => request.get('/admin/users', { params }),
  detail: (id: string) => request.get(`/admin/users/${id}`),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/admin/users/${id}`, payload),
  ban: (id: string, payload?: Record<string, unknown>) => request.post(`/admin/users/${id}/ban`, payload),
  unban: (id: string) => request.post(`/admin/users/${id}/unban`),
  mute: (id: string, payload?: Record<string, unknown>) => request.post(`/admin/users/${id}/mute`, payload),
  unmute: (id: string) => request.post(`/admin/users/${id}/unmute`),
  updateRole: (id: string, payload: Record<string, unknown>) => request.put(`/admin/users/${id}/role`, payload),
  resetPassword: (id: string) => request.post(`/admin/users/${id}/reset-pwd`),
  roles: () => request.get('/admin/roles'),
  updateRolePermission: (id: string, payload: Record<string, unknown>) => request.put(`/admin/roles/${id}`, payload),
};

export const adminAuditApi = {
  queue: (params?: Record<string, unknown>) => request.get('/admin/audit/queue', { params }),
  approve: (id: string) => request.post(`/admin/audit/${id}/approve`),
  reject: (id: string, payload?: Record<string, unknown>) => request.post(`/admin/audit/${id}/reject`, payload),
  delete: (id: string) => request.post(`/admin/audit/${id}/delete`),
  restore: (id: string) => request.post(`/admin/audit/${id}/restore`),
  batch: (payload: Record<string, unknown>) => request.post('/admin/audit/batch', payload),
  history: (params?: Record<string, unknown>) => request.get('/admin/audit/history', { params }),
  sensitiveWords: () => request.get('/admin/sensitive-words'),
  createSensitiveWord: (payload: Record<string, unknown>) => request.post('/admin/sensitive-words', payload),
  deleteSensitiveWord: (id: string) => request.delete(`/admin/sensitive-words/${id}`),
  importSensitiveWords: (payload: Record<string, unknown>) => request.post('/admin/sensitive-words/import', payload),
  sensitiveWordGroups: () => request.get('/admin/sensitive-words/groups'),
  toggleSensitiveWordGroup: (group: string, payload: { enabled: boolean }) =>
    request.put(`/admin/sensitive-words/groups/${encodeURIComponent(group)}/toggle`, payload),
  sensitiveWordWhitelist: () => request.get('/admin/sensitive-words/whitelist'),
  updateSensitiveWordWhitelist: (payload: Record<string, unknown>) =>
    request.put('/admin/sensitive-words/whitelist', payload),

  // Content moderation pending queue
  pendingQueue: (params?: Record<string, unknown>) => request.get('/admin/audit/pending', { params }),
  approvePending: (contentType: string, id: string) => request.post(`/admin/audit/pending/${contentType}/${id}/approve`),
  rejectPending: (contentType: string, id: string, payload?: Record<string, unknown>) => request.post(`/admin/audit/pending/${contentType}/${id}/reject`, payload),
  batchPending: (payload: Record<string, unknown>) => request.post('/admin/audit/pending/batch', payload),
};

export const adminForumApi = {
  categories: () => request.get('/admin/categories'),
  createCategory: (payload: Record<string, unknown>) => request.post('/admin/categories', payload),
  updateCategory: (id: string, payload: Record<string, unknown>) => request.put(`/admin/categories/${id}`, payload),
  deleteCategory: (id: string) => request.delete(`/admin/categories/${id}`),
  sortCategories: (payload: Record<string, unknown>) => request.put('/admin/categories/sort', payload),
  posts: (params?: Record<string, unknown>) => request.get('/admin/posts', { params }),
  postDetail: (id: string) => request.get(`/admin/posts/${id}`),
  pinPost: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/posts/${id}/pin`, payload),
  featurePost: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/posts/${id}/feature`, payload),
  lockPost: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/posts/${id}/lock`, payload),
  movePost: (id: string, payload: Record<string, unknown>) => request.put(`/admin/posts/${id}/move`, payload),
  deletePost: (id: string) => request.delete(`/admin/posts/${id}`),
};

export const adminQaApi = {
  questions: (params?: Record<string, unknown>) => request.get('/admin/questions', { params }),
  closeQuestion: (id: string) => request.put(`/admin/questions/${id}/close`),
  duplicateQuestion: (id: string, payload: Record<string, unknown>) => request.put(`/admin/questions/${id}/duplicate`, payload),
  deleteQuestion: (id: string) => request.delete(`/admin/questions/${id}`),
  deleteAnswer: (id: string) => request.delete(`/admin/answers/${id}`),
  acceptAnswer: (id: string) => request.put(`/admin/answers/${id}/accept`),
  bounties: () => request.get('/admin/bounties'),
  settleBounty: (id: string, payload?: Record<string, unknown>) => request.post(`/admin/bounties/${id}/settle`, payload),
};

export const adminBlogApi = {
  blogs: (params?: Record<string, unknown>) => request.get('/admin/blogs', { params }),
  recommend: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/blogs/${id}/recommend`, payload),
  banner: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/blogs/${id}/banner`, payload),
  deleteBlog: (id: string) => request.delete(`/admin/blogs/${id}`),
  series: () => request.get('/admin/blog-series'),
  updateSeries: (id: string, payload: Record<string, unknown>) => request.put(`/admin/blog-series/${id}`, payload),
  deleteSeries: (id: string) => request.delete(`/admin/blog-series/${id}`),
  categories: () => request.get('/admin/blog-categories'),
  createCategory: (payload: Record<string, unknown>) => request.post('/admin/blog-categories', payload),
  updateCategory: (id: string, payload: Record<string, unknown>) => request.put(`/admin/blog-categories/${id}`, payload),
  deleteCategory: (id: string) => request.delete(`/admin/blog-categories/${id}`),
};

export const adminProjectApi = {
  projects: (params?: Record<string, unknown>) => request.get('/admin/projects', { params }),
  recommend: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/projects/${id}/recommend`, payload),
  feature: (id: string, payload?: Record<string, unknown>) => request.put(`/admin/projects/${id}/feature`, payload),
  updateStatus: (id: string, payload: { status: string }) => request.put(`/admin/projects/${id}/status`, payload),
  deleteProject: (id: string) => request.delete(`/admin/projects/${id}`),
  categories: () => request.get('/admin/project-categories'),
  createCategory: (payload: Record<string, unknown>) => request.post('/admin/project-categories', payload),
  updateCategory: (id: string, payload: Record<string, unknown>) => request.put(`/admin/project-categories/${id}`, payload),
  deleteCategory: (id: string) => request.delete(`/admin/project-categories/${id}`),
};

export const adminCommentApi = {
  comments: (params?: Record<string, unknown>) => request.get('/admin/comments', { params }),
  deleteComment: (id: string) => request.delete(`/admin/comments/${id}`),
  batchDelete: (payload: Record<string, unknown>) => request.post('/admin/comments/batch-delete', payload),
  reports: (params?: Record<string, unknown>) => request.get('/admin/reports', { params }),
  handleReport: (id: string, payload: Record<string, unknown>) => request.put(`/admin/reports/${id}/handle`, payload),
  reportStats: () => request.get('/admin/reports/stats'),
  blacklist: () => request.get('/admin/blacklist'),
  addBlacklist: (payload: Record<string, unknown>) => request.post('/admin/blacklist', payload),
  removeBlacklist: (id: string) => request.delete(`/admin/blacklist/${id}`),
};

export const adminTagApi = {
  tags: () => request.get('/admin/tags'),
  createTag: (payload: Record<string, unknown>) => request.post('/admin/tags', payload),
  updateTag: (id: string, payload: Record<string, unknown>) => request.put(`/admin/tags/${id}`, payload),
  deleteTag: (id: string) => request.delete(`/admin/tags/${id}`),
  mergeTags: (payload: Record<string, unknown>) => request.post('/admin/tags/merge', payload),
  tagStats: () => request.get('/admin/tags/stats'),
  categoryTree: () => request.get('/admin/categories'),
  createCategory: (payload: Record<string, unknown>) => request.post('/admin/categories', payload),
  updateCategory: (id: string, payload: Record<string, unknown>) => request.put(`/admin/categories/${id}`, payload),
  deleteCategory: (id: string) => request.delete(`/admin/categories/${id}`),
  sortCategoryTree: (payload: Record<string, unknown>) => request.put('/admin/categories/sort', payload),
  categoryApplications: (params?: Record<string, unknown>) => request.get('/admin/categories/applications', { params }),
  reviewCategoryApplication: (id: string, payload: Record<string, unknown>) =>
    request.put(`/admin/categories/applications/${id}/review`, payload),
};

export const adminAnalyticsApi = {
  users: (params?: Record<string, unknown>) => request.get('/admin/analytics/users', { params }),
  content: (params?: Record<string, unknown>) => request.get('/admin/analytics/content', { params }),
  interactions: (params?: Record<string, unknown>) => request.get('/admin/analytics/interactions', { params }),
  traffic: (params?: Record<string, unknown>) => request.get('/admin/analytics/traffic', { params }),
  retention: (params?: Record<string, unknown>) => request.get('/admin/analytics/retention', { params }),
  funnel: (params?: Record<string, unknown>) => request.get('/admin/analytics/funnel', { params }),
  moduleTraffic: () => request.get('/admin/analytics/module-traffic'),
  regionTraffic: () => request.get('/admin/analytics/region-traffic'),
  privateMessages: (params?: Record<string, unknown>) => request.get('/admin/analytics/private-messages', { params }),
  homeClicks: (params?: Record<string, unknown>) => request.get('/admin/analytics/home-clicks', { params }),
  ipProtection: (params?: Record<string, unknown>) => request.get('/admin/analytics/ip-protection', { params }),
  ipProtectionTrend: (params?: Record<string, unknown>) =>
    request.get('/admin/analytics/ip-protection/trend', { params }),
  ipProtectionExport: (params?: Record<string, unknown>) =>
    request.get('/admin/analytics/ip-protection/export', { params, responseType: 'blob' }) as unknown as Promise<Blob>,
  export: (payload: Record<string, unknown>) => request.post('/admin/analytics/export', payload),
};

export const adminIpBlacklistApi = {
  list: () => request.get('/admin/ip-blacklist'),
  add: (payload: { ip: string; reason?: string }) => request.post('/admin/ip-blacklist', payload),
  remove: (id: string) => request.delete(`/admin/ip-blacklist/${id}`),
};

export const adminIpWhitelistApi = {
  list: () => request.get('/admin/ip-whitelist'),
  add: (payload: { ip: string; reason?: string }) => request.post('/admin/ip-whitelist', payload),
  remove: (id: string) => request.delete(`/admin/ip-whitelist/${id}`),
};

export const adminSnippetApi = {
  list: (params?: Record<string, unknown>) => request.get('/admin/snippets', { params }),
  recommend: (id: string) => request.put(`/admin/snippets/${id}/recommend`),
  feature: (id: string) => request.put(`/admin/snippets/${id}/feature`),
  deleteSnippet: (id: string) => request.delete(`/admin/snippets/${id}`),
};

export const adminSettingsApi = {
  getGroup: (group: string) => request.get(`/admin/settings/${group}`),
  updateGroup: (group: string, payload: Record<string, unknown>) => request.put(`/admin/settings/${group}`, payload),
  testEmail: (payload: Record<string, unknown>) => request.post('/admin/settings/email/test', payload),
  testStorage: (payload: Record<string, unknown>) => request.post('/admin/settings/storage/test', payload),
  testAI: (payload: Record<string, unknown>) => request.post('/admin/settings/content_moderation/test-ai', payload),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const adminOperationsApi = {
  announcements: () => request.get('/admin/announcements'),
  createAnnouncement: (payload: Record<string, unknown>) => request.post('/admin/announcements', payload),
  updateAnnouncement: (id: string, payload: Record<string, unknown>) => request.put(`/admin/announcements/${id}`, payload),
  deleteAnnouncement: (id: string) => request.delete(`/admin/announcements/${id}`),
  banners: () => request.get('/admin/banners'),
  createBanner: (payload: Record<string, unknown>) => request.post('/admin/banners', payload),
  updateBanner: (id: string, payload: Record<string, unknown>) => request.put(`/admin/banners/${id}`, payload),
  deleteBanner: (id: string) => request.delete(`/admin/banners/${id}`),
  sortBanners: (payload: Record<string, unknown>) => request.put('/admin/banners/sort', payload),
  recommendations: () => request.get('/admin/recommendations'),
  updateRecommendations: (payload: Record<string, unknown>) => request.put('/admin/recommendations', payload),
  sendEmail: (payload: Record<string, unknown>) => request.post('/admin/email/send', payload),
  emailHistory: (params?: Record<string, unknown>) => request.get('/admin/email/history', { params }),
  logs: (params?: Record<string, unknown>) => request.get('/admin/logs', { params }),
  exportLogs: (payload: Record<string, unknown>) => request.post('/admin/logs/export', payload),
  notifications: (params?: Record<string, unknown>) => request.get('/admin/notifications', { params }),
  markNotificationRead: (id: string) => request.put(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => request.put('/admin/notifications/read-all'),
  removeNotification: (id: string) => request.delete(`/admin/notifications/${id}`),
  createBackup: () => request.post('/admin/backup'),
  backupList: () => request.get('/admin/backup/list'),
  downloadBackup: (id: string) => request.get(`/admin/backup/${id}/download`),
  downloadBackupFile: (id: string) =>
    request.get(`/admin/backup/${id}/file`, { responseType: 'blob' }) as unknown as Promise<Blob>,
  restoreBackup: (id: string) => request.post(`/admin/backup/${id}/restore`),
  updateBackupSchedule: (payload: Record<string, unknown>) => request.put('/admin/backup/schedule', payload),
  pollConfig: () => request.get('/admin/poll/config'),
  updatePollConfig: (payload: Record<string, unknown>) => request.put('/admin/poll/config', payload),
};
