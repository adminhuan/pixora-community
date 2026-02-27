export interface PointsRule {
  action: string;
  points: number;
  type: 'earn' | 'spend';
  description: string;
}

export const POINTS_RULES: PointsRule[] = [
  { action: 'login', points: 5, type: 'earn', description: '每日登录' },
  { action: 'post', points: 10, type: 'earn', description: '发布帖子' },
  { action: 'blog', points: 20, type: 'earn', description: '发布博客' },
  { action: 'answer', points: 10, type: 'earn', description: '提交回答' },
  { action: 'answer_accepted', points: 50, type: 'earn', description: '回答被采纳' },
  { action: 'receive_like', points: 2, type: 'earn', description: '获得点赞' },
  { action: 'project', points: 15, type: 'earn', description: '发布项目' },
  { action: 'bounty', points: 20, type: 'spend', description: '设置悬赏' }
];

export const calculateLevel = (points: number): { level: number; title: string } => {
  if (points <= 100) return { level: 1, title: '新手' };
  if (points <= 500) return { level: 2, title: '入门' };
  if (points <= 2000) return { level: 3, title: '进阶' };
  if (points <= 5000) return { level: 4, title: '高手' };
  if (points <= 20000) return { level: 5, title: '大师' };
  return { level: 6, title: '宗师' };
};
