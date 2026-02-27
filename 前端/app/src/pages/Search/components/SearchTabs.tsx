import { Tabs } from '../../../components/ui';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'post', label: '帖子' },
  { key: 'qa', label: '问答' },
  { key: 'blog', label: '博客' },
  { key: 'snippet', label: '代码' },
  { key: 'project', label: '项目' },
  { key: 'user', label: '用户' },
];

interface SearchTabsProps {
  active: string;
  onChange: (key: string) => void;
}

export const SearchTabs = ({ active, onChange }: SearchTabsProps) => <Tabs items={tabs} activeKey={active} onChange={onChange} />;
