import { Tabs } from '../../../components/ui';

interface CategoryItem {
  key: string;
  label: string;
}

interface CategoryNavProps {
  value: string;
  onChange: (value: string) => void;
  items: CategoryItem[];
}

export const CategoryNav = ({ value, onChange, items }: CategoryNavProps) => (
  <Tabs items={items} activeKey={value} onChange={onChange} />
);
