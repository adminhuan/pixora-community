import { Card } from '../ui';

interface NotificationDropdownProps {
  list: Array<{ id: string; title: string; read?: boolean }>;
}

export const NotificationDropdown = ({ list }: NotificationDropdownProps) => (
  <Card title="最近通知">
    <div style={{ display: 'grid', gap: 8 }}>
      {list.slice(0, 5).map((item) => (
        <div key={item.id} style={{ color: item.read ? 'var(--color-textSecondary)' : 'var(--color-text)' }}>
          {item.title}
        </div>
      ))}
    </div>
  </Card>
);
