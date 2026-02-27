import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../../api';
import { NotificationSettings } from '../../components/Notification/NotificationSettings';
import { NotificationToast } from '../../components/Notification/NotificationToast';
import { Card, Empty, Loading, Tabs } from '../../components/ui';
import { useAuth, useNotification } from '../../hooks';
import { connectNotificationSocket } from '../../services/websocket';
import { extractData, extractList, getErrorMessage } from '../../utils';
import { NotificationItem } from './components/NotificationItem';

interface NotificationRecord {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
  type: string;
  targetType: string;
  targetId: string;
}

const tabItems = [
  { key: 'all', label: '全部' },
  { key: 'interaction', label: '互动通知' },
  { key: 'qa', label: '问答通知' },
  { key: 'system', label: '系统通知' },
];

const isTypeMatch = (type: string, tab: string) => {
  if (tab === 'all') {
    return true;
  }

  const normalized = type.toLowerCase();

  if (tab === 'interaction') {
    return ['comment', 'reply', 'like', 'favorite', 'follow', 'private_message'].some((item) => normalized.includes(item));
  }

  if (tab === 'qa') {
    return ['question', 'answer', 'bounty', 'accept'].some((item) => normalized.includes(item));
  }

  return ['system', 'security', 'announcement'].some((item) => normalized.includes(item));
};

const NotificationCenterPage = () => {
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const { isAuthenticated, accessToken } = useAuth();
  const { latestMessage } = useNotification();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [listRes, unreadRes] = await Promise.all([notificationApi.list(), notificationApi.unreadCount()]);
      const list = extractList<Record<string, unknown>>(listRes).map((item) => ({
        id: String(item.id ?? ''),
        title: String(item.title ?? item.type ?? '系统通知'),
        content: String(item.content ?? item.message ?? ''),
        createdAt: String(item.createdAt ?? new Date().toISOString()),
        read: Boolean(item.isRead ?? false),
        type: String(item.type ?? 'system'),
        targetType: String(item.targetType ?? ''),
        targetId: String(item.targetId ?? ''),
      }));

      const unread = extractData<Record<string, unknown>>(unreadRes, { count: 0 });
      setUnreadCount(Number(unread.count ?? 0));
      setNotifications(list.filter((item) => item.id));
    } catch (err) {
      setError(getErrorMessage(err, '通知加载失败，请先登录后重试'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const socket = connectNotificationSocket(accessToken);

    const handleConnect = () => {
      void fetchNotifications();
    };

    const handleNotificationCount = (payload: { count?: number }) => {
      setUnreadCount(Math.max(0, Number(payload.count ?? 0) || 0));
    };

    const handleNotification = () => {
      void fetchNotifications();
    };

    socket.on('connect', handleConnect);
    socket.on('notification:count', handleNotificationCount);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:count', handleNotificationCount);
      socket.off('notification:new', handleNotification);
    };
  }, [accessToken, fetchNotifications, isAuthenticated]);

  const list = useMemo(() => notifications.filter((item) => isTypeMatch(item.type, active)), [active, notifications]);

  const resolveTargetPath = (item: NotificationRecord) => {
    const targetType = String(item.targetType ?? '').trim();
    const targetId = String(item.targetId ?? '').trim();
    const type = String(item.type ?? '').trim();

    if (!targetType || !targetId) {
      return '';
    }

    if (targetType === 'post') {
      return `/forum/${targetId}`;
    }
    if (targetType === 'blog') {
      return `/blog/${targetId}`;
    }
    if (targetType === 'project') {
      return `/projects/${targetId}`;
    }
    if (targetType === 'snippet') {
      return `/code/${targetId}`;
    }
    if (targetType === 'question') {
      return `/qa/${targetId}`;
    }
    if (targetType === 'private_message' || type === 'private_message') {
      return `/messages?conversationId=${encodeURIComponent(targetId)}`;
    }

    return '';
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title={`通知中心（未读 ${unreadCount}）`}>
        <Tabs items={tabItems} activeKey={active} onChange={setActive} />
      </Card>

      {loading && <Loading text="通知加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}

      {!loading && !list.length && <Empty description="暂无通知" />}

      {list.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          targetPath={resolveTargetPath(item)}
          onRead={async (id) => {
            await notificationApi.read(id);
            await fetchNotifications();
          }}
          onDelete={async (id) => {
            await notificationApi.remove(id);
            await fetchNotifications();
          }}
        />
      ))}

      <NotificationSettings />
      <NotificationToast message={latestMessage} />
    </div>
  );
};

export default NotificationCenterPage;
