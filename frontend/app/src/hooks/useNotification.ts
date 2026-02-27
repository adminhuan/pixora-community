import { useEffect, useState } from 'react';
import { connectNotificationSocket } from '../services/websocket';
import { useAuth } from './useAuth';

export const useNotification = () => {
  const [connected, setConnected] = useState(false);
  const [latestMessage, setLatestMessage] = useState<string>('');
  const { isAuthenticated, accessToken } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setConnected(false);
      return;
    }

    const socket = connectNotificationSocket(accessToken);

    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleNotification = (payload: { title?: string; content?: string }) => {
      setLatestMessage(payload.title ?? payload.content ?? '收到一条新通知');
    };

    const handlePrivateMessage = (payload: { sender?: { nickname?: string; username?: string }; message?: { content?: string } }) => {
      const senderName = payload.sender?.nickname || payload.sender?.username || '用户';
      const preview = String(payload.message?.content ?? '').trim();
      setLatestMessage(preview ? `${senderName}：${preview}` : `收到来自 ${senderName} 的私信`);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('notification:new', handleNotification);
    socket.on('private-message:new', handlePrivateMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification:new', handleNotification);
      socket.off('private-message:new', handlePrivateMessage);
    };
  }, [accessToken, isAuthenticated]);

  return { connected, latestMessage };
};
