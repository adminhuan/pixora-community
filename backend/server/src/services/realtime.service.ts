import http from 'http';
import { Server, Socket } from 'socket.io';
import prisma from '../config/database';
import { config } from '../config';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: Server | null = null;

const normalizeOrigin = (origin: string): string => {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.trim();
  }
};

const allowedOrigins = new Set(config.corsOrigins.map((item) => normalizeOrigin(item)).filter(Boolean));

const isDevLoopback = (origin: string): boolean => {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch {
    return false;
  }
};

const resolveSocketToken = (socket: Socket): string => {
  const authToken = String((socket.handshake.auth as { token?: string } | undefined)?.token ?? '').trim();
  if (authToken) {
    return authToken;
  }

  const queryToken = String((socket.handshake.query as { token?: string } | undefined)?.token ?? '').trim();
  if (queryToken) {
    return queryToken;
  }

  const authorization = String(socket.handshake.headers.authorization ?? '').trim();
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  return '';
};

const getUserRoom = (userId: string) => `user:${userId}`;

const emitTyping = async (senderId: string, payload: unknown) => {
  if (!io || !payload || typeof payload !== 'object') {
    return;
  }

  const input = payload as { conversationId?: unknown; isTyping?: unknown };
  const conversationId = String(input.conversationId ?? '').trim();
  if (!conversationId) {
    return;
  }

  const conversation = await prisma.privateConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userAId: true,
      userBId: true,
    },
  });

  if (!conversation) {
    return;
  }

  if (conversation.userAId !== senderId && conversation.userBId !== senderId) {
    return;
  }

  const peerId = conversation.userAId === senderId ? conversation.userBId : conversation.userAId;
  const isTyping = input.isTyping !== false;
  io.to(getUserRoom(peerId)).emit('private-message:typing', {
    conversationId,
    fromUserId: senderId,
    isTyping,
    at: new Date().toISOString(),
  });
};

export const initRealtimeServer = (server: http.Server): Server => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (config.env === 'development') {
          const normalized = normalizeOrigin(origin);
          if (allowedOrigins.has(normalized) || isDevLoopback(normalized)) {
            callback(null, true);
            return;
          }
          callback(null, false);
          return;
        }

        if (allowedOrigins.size === 0) {
          callback(new Error('WS CORS: 生产环境必须配置 CORS_ORIGINS'));
          return;
        }

        callback(null, allowedOrigins.has(normalizeOrigin(origin)));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = resolveSocketToken(socket);
    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    try {
      const claims = verifyAccessToken(token);
      socket.data.userId = claims.sub;
      socket.data.username = claims.username;
      next();
    } catch (error) {
      logger.warn('WS auth failed', {
        reason: error instanceof Error ? error.message : 'UNKNOWN',
      });
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = String(socket.data.userId ?? '').trim();
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(getUserRoom(userId));
    socket.emit('notification:connect', { ok: true, userId });

    socket.on('private-message:typing', (payload) => {
      void emitTyping(userId, payload).catch((error) => {
        logger.warn('WS typing emit failed', {
          userId,
          reason: error instanceof Error ? error.message : 'UNKNOWN',
        });
      });
    });
  });

  return io;
};

export const emitPrivateMessage = (userId: string, payload: Record<string, unknown>) => {
  if (!io) {
    return;
  }
  io.to(getUserRoom(userId)).emit('private-message:new', payload);
};

export const emitPrivateMessageCount = (userId: string, count: number) => {
  if (!io) {
    return;
  }
  io.to(getUserRoom(userId)).emit('private-message:count', { count });
};

export const emitPrivateMessageRecalled = (userId: string, payload: Record<string, unknown>) => {
  if (!io) {
    return;
  }
  io.to(getUserRoom(userId)).emit('private-message:recalled', payload);
};

export const emitNotification = (userId: string, payload: Record<string, unknown>) => {
  if (!io) {
    return;
  }
  io.to(getUserRoom(userId)).emit('notification:new', payload);
};

export const emitNotificationCount = (userId: string, count: number) => {
  if (!io) {
    return;
  }
  io.to(getUserRoom(userId)).emit('notification:count', { count });
};
