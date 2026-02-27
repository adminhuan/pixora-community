import { useMemo, useState } from 'react';

interface DropdownItem {
  key: string;
  label: string;
}

interface DropdownProps {
  items: DropdownItem[];
  onSelect: (key: string) => void;
  placeholder?: string;
}

export const Dropdown = ({ items, onSelect, placeholder = '请选择' }: DropdownProps) => {
  const [selected, setSelected] = useState<string>('');

  const label = useMemo(
    () => items.find((item) => item.key === selected)?.label ?? placeholder,
    [items, placeholder, selected],
  );

  return (
    <select
      className="select"
      value={selected}
      onChange={(event) => {
        const key = event.target.value;
        setSelected(key);
        onSelect(key);
      }}
      aria-label="dropdown"
    >
      <option value="">{label}</option>
      {items.map((item) => (
        <option key={item.key} value={item.key}>
          {item.label}
        </option>
      ))}
    </select>
  );
};
