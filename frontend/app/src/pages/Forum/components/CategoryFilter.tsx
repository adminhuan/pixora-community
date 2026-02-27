import { Tabs } from '../../../components/ui';

interface CategoryFilterItem {
  key: string;
  label: string;
}

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  items: CategoryFilterItem[];
}

export const CategoryFilter = ({ value, onChange, items }: CategoryFilterProps) => (
  <Tabs items={items} activeKey={value} onChange={onChange} />
);
