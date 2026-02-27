import { Tabs } from '../../../components/ui';

const tabItems = [
  { key: 'posts', label: '帖子' },
  { key: 'answers', label: '回答' },
  { key: 'blogs', label: '博客' },
  { key: 'snippets', label: '代码' },
  { key: 'projects', label: '项目' },
  { key: 'favorites', label: '收藏' },
];

interface ContentTabsProps {
  active: string;
  onChange: (key: string) => void;
}

export const ContentTabs = ({ active, onChange }: ContentTabsProps) => (
  <Tabs items={tabItems} activeKey={active} onChange={onChange} />
);
