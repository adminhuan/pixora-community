import { COMPONENT_CATEGORIES } from './component-categories';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategorySelect = ({ value, onChange }: CategorySelectProps) => (
  <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
    {COMPONENT_CATEGORIES.map((cat) => (
      <option key={cat.key} value={cat.key}>{cat.label}</option>
    ))}
  </select>
);
