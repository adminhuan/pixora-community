import { Tabs } from '../../../components/ui';

const items = [
  { key: 'total', label: '总积分排行' },
  { key: 'active', label: '活跃排行' },
  { key: 'contribution', label: '贡献排行' },
  { key: 'creation', label: '创作排行' },
  { key: 'project', label: '项目排行' },
  { key: 'rookie', label: '新星排行' },
];

interface RankingTabsProps {
  active: string;
  onChange: (key: string) => void;
}

export const RankingTabs = ({ active, onChange }: RankingTabsProps) => <Tabs items={items} activeKey={active} onChange={onChange} />;
