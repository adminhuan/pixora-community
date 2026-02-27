import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;
let socketToken = '';

const getWsUrl = () => {
  const configuredWsUrl = String(import.meta.env.VITE_WS_URL ?? '').trim();
  if (configuredWsUrl) {
    return configuredWsUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'https://pixora.vip';
};

const resolveToken = (input?: string | null): string => {
  const explicitToken = String(input ?? '').trim();
  if (explicitToken) {
    return explicitToken;
  }
  return String(useAuthStore.getState().accessToken ?? '').trim();
};

export const connectNotificationSocket = (tokenInput?: string | null) => {
  const token = resolveToken(tokenInput);
  if (!token) {
    throw new Error('请先登录后建立实时连接');
  }

  if (socket) {
    if (token !== socketToken) {
      socketToken = token;
      socket.auth = { token };
      socket.io.opts.query = { token };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    }
    return socket;
  }

  const wsUrl = getWsUrl();
  socketToken = token;
  socket = io(wsUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnectionAttempts: 5,
    auth: { token },
    query: { token },
  });

  return socket;
};

export const disconnectNotificationSocket = () => {
  socket?.disconnect();
  socket = null;
  socketToken = '';
};
