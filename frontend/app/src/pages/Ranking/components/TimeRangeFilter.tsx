import { Tabs } from '../../../components/ui';

const items = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
];

interface TimeRangeFilterProps {
  active: string;
  onChange: (key: string) => void;
}

export const TimeRangeFilter = ({ active, onChange }: TimeRangeFilterProps) => (
  <Tabs items={items} activeKey={active} onChange={onChange} />
);
