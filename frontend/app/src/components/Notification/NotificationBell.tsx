import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NotificationBellProps {
  unread?: number;
}

export const NotificationBell = ({ unread = 0 }: NotificationBellProps) => (
  <Link to="/notifications" style={{ position: 'relative', display: 'inline-flex' }} aria-label="通知中心">
    <Bell size={20} />
    {unread > 0 && (
      <span
        style={{
          position: 'absolute',
          top: -6,
          right: -8,
          minWidth: 16,
          height: 16,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          fontSize: 10,
          color: '#fff',
          background: 'var(--color-error)',
        }}
      >
        {unread > 99 ? '99+' : unread}
      </span>
    )}
  </Link>
);
