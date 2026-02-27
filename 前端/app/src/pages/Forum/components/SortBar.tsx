import { Tabs } from '../../../components/ui';

const sortItems = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '最热' },
  { key: 'featured', label: '精华' },
];

interface SortBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortBar = ({ value, onChange }: SortBarProps) => <Tabs items={sortItems} activeKey={value} onChange={onChange} />;
