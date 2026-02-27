import clsx from 'classnames';

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const Tabs = ({ items, activeKey, onChange }: TabsProps) => (
  <div className="cp-tabs">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        className={clsx('cp-tab', item.key === activeKey && 'cp-tab--active')}
        onClick={() => onChange(item.key)}
      >
        {item.label}
      </button>
    ))}
  </div>
);
