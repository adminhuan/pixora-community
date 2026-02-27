import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messageApi, type MessageAttachmentPayload } from '../../api';
import { Button, Card, Empty, Loading } from '../../components/ui';
import { useAuth } from '../../hooks';
import { connectNotificationSocket } from '../../services/websocket';
import { extractData, extractList, getErrorMessage, openSafeUrlInNewTab, resolveSafeImageSrc } from '../../utils';

interface MessageUser {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
}

interface ConversationRecord {
  id: string;
  peer: MessageUser;
  lastMessageContent: string;
  lastMessageAt: string;
  updatedAt: string;
  unreadCount: number;
}

interface MessageRecord {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments: MessageAttachmentPayload[];
  createdAt: string;
  isRead: boolean;
  isRecalled: boolean;
  sender: MessageUser;
}

interface MessageBlockStatus {
  userId: string;
  blockedByMe: boolean;
  blockedMe: boolean;
  canSend: boolean;
  reason?: string;
}

interface PrivateMessageSocketPayload {
  conversationId?: unknown;
  message?: unknown;
  sender?: unknown;
}

interface PrivateMessageTypingPayload {
  conversationId?: unknown;
  fromUserId?: unknown;
  isTyping?: unknown;
}

interface PrivateMessageRecalledPayload {
  conversationId?: unknown;
  messageId?: unknown;
  content?: unknown;
  lastMessageContent?: unknown;
  lastMessageAt?: unknown;
}

const MESSAGE_PAGE_SIZE = 30;
const MESSAGE_MAX_LENGTH = 5000;
const MESSAGE_MAX_ATTACHMENTS = 6;
const MESSAGE_MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const MESSAGE_RECALL_WINDOW_MS = 2 * 60 * 1000;
const MESSAGE_RECALLED_CONTENT = '[消息已撤回]';
const TYPING_IDLE_TIMEOUT_MS = 1200;
const TYPING_DISPLAY_TIMEOUT_MS = 2500;

const formatFileSize = (size?: number) => {
  const value = Number(size ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  if (value < 1024) {
    return `${value}B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)}KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
};

const parseUser = (raw: unknown): MessageUser => {
  if (!raw || typeof raw !== 'object') {
    return { id: '', username: '未知用户' };
  }

  const input = raw as { id?: unknown; username?: unknown; nickname?: unknown; avatar?: unknown };
  return {
    id: String(input.id ?? '').trim(),
    username: String(input.username ?? '').trim() || '未知用户',
    nickname: String(input.nickname ?? '').trim() || undefined,
    avatar: String(input.avatar ?? '').trim() || undefined,
  };
};

const parseConversation = (raw: unknown): ConversationRecord | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const input = raw as {
    id?: unknown;
    peer?: unknown;
    lastMessageContent?: unknown;
    lastMessageAt?: unknown;
    updatedAt?: unknown;
    unreadCount?: unknown;
  };

  const id = String(input.id ?? '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    peer: parseUser(input.peer),
    lastMessageContent: String(input.lastMessageContent ?? '').trim(),
    lastMessageAt: String(input.lastMessageAt ?? '').trim(),
    updatedAt: String(input.updatedAt ?? '').trim(),
    unreadCount: Math.max(0, Number(input.unreadCount ?? 0) || 0),
  };
};

const parseAttachment = (raw: unknown): MessageAttachmentPayload | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const input = raw as {
    url?: unknown;
    type?: unknown;
    fileId?: unknown;
    name?: unknown;
    size?: unknown;
    mime?: unknown;
  };

  const url = String(input.url ?? '').trim();
  if (!url) {
    return null;
  }

  const rawType = String(input.type ?? '').trim().toLowerCase();
  const mime = String(input.mime ?? '').trim();
  const inferredType: 'image' | 'file' =
    rawType === 'image' || rawType === 'file' ? rawType : mime.startsWith('image/') ? 'image' : 'file';

  const fileId = String(input.fileId ?? '').trim();
  const name = String(input.name ?? '').trim();
  const rawSize = Number(input.size ?? 0);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : undefined;

  return {
    url,
    type: inferredType,
    ...(fileId ? { fileId } : {}),
    ...(name ? { name } : {}),
    ...(size ? { size } : {}),
    ...(mime ? { mime } : {}),
  };
};

const parseAttachments = (raw: unknown): MessageAttachmentPayload[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => parseAttachment(item))
    .filter((item): item is MessageAttachmentPayload => Boolean(item))
    .slice(0, MESSAGE_MAX_ATTACHMENTS);
};

const parseBlockStatus = (raw: unknown): MessageBlockStatus => {
  if (!raw || typeof raw !== 'object') {
    return {
      userId: '',
      blockedByMe: false,
      blockedMe: false,
      canSend: true,
    };
  }

  const input = raw as {
    userId?: unknown;
    blockedByMe?: unknown;
    blockedMe?: unknown;
    canSend?: unknown;
    reason?: unknown;
  };

  const blockedByMe = Boolean(input.blockedByMe);
  const blockedMe = Boolean(input.blockedMe);
  const canSend = input.canSend !== undefined ? Boolean(input.canSend) : !blockedByMe && !blockedMe;
  const reason = String(input.reason ?? '').trim() || undefined;

  return {
    userId: String(input.userId ?? '').trim(),
    blockedByMe,
    blockedMe,
    canSend,
    ...(reason ? { reason } : {}),
  };
};

const buildMessagePreview = (content: string, attachments: MessageAttachmentPayload[]) => {
  if (content) {
    return content;
  }
  if (attachments.length === 0) {
    return '';
  }
  if (attachments.length === 1) {
    return attachments[0].type === 'image' ? '[图片]' : `[文件] ${attachments[0].name || '附件'}`;
  }
  return `[附件] 共 ${attachments.length} 个`;
};

const parseMessage = (raw: unknown): MessageRecord | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const input = raw as {
    id?: unknown;
    senderId?: unknown;
    receiverId?: unknown;
    content?: unknown;
    attachments?: unknown;
    createdAt?: unknown;
    isRead?: unknown;
    isRecalled?: unknown;
    sender?: unknown;
  };

  const id = String(input.id ?? '').trim();
  if (!id) {
    return null;
  }

  const content = String(input.content ?? '').trim();

  return {
    id,
    senderId: String(input.senderId ?? '').trim(),
    receiverId: String(input.receiverId ?? '').trim(),
    content,
    attachments: parseAttachments(input.attachments),
    createdAt: String(input.createdAt ?? '').trim(),
    isRead: Boolean(input.isRead),
    isRecalled: Boolean(input.isRecalled) || content === MESSAGE_RECALLED_CONTENT,
    sender: parseUser(input.sender),
  };
};

const parseSocketMessage = (rawMessage: unknown, senderRaw: unknown): MessageRecord | null => {
  if (!rawMessage || typeof rawMessage !== 'object') {
    return null;
  }

  const input = rawMessage as {
    id?: unknown;
    senderId?: unknown;
    receiverId?: unknown;
    content?: unknown;
    attachments?: unknown;
    createdAt?: unknown;
    isRead?: unknown;
    isRecalled?: unknown;
    sender?: unknown;
  };

  const id = String(input.id ?? '').trim();
  if (!id) {
    return null;
  }

  const content = String(input.content ?? '').trim();
  return {
    id,
    senderId: String(input.senderId ?? '').trim(),
    receiverId: String(input.receiverId ?? '').trim(),
    content,
    attachments: parseAttachments(input.attachments),
    createdAt: String(input.createdAt ?? '').trim(),
    isRead: Boolean(input.isRead),
    isRecalled: Boolean(input.isRecalled) || content === MESSAGE_RECALLED_CONTENT,
    sender: parseUser(senderRaw ?? input.sender),
  };
};

const getDisplayName = (user: MessageUser | null | undefined) => {
  if (!user) {
    return '未知用户';
  }
  return user.nickname || user.username || '未知用户';
};

const formatTime = (value: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildDraftStorageKey = (userId: string, conversationId: string) => `message-draft:${userId}:${conversationId}`;

const readDraft = (userId: string, conversationId: string): string => {
  try {
    return String(localStorage.getItem(buildDraftStorageKey(userId, conversationId)) ?? '').slice(0, MESSAGE_MAX_LENGTH);
  } catch {
    return '';
  }
};

const writeDraft = (userId: string, conversationId: string, content: string) => {
  const key = buildDraftStorageKey(userId, conversationId);
  try {
    const next = String(content ?? '').slice(0, MESSAGE_MAX_LENGTH);
    if (!next.trim()) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, next);
  } catch {
    // ignore localStorage failures
  }
};

const clearDraft = (userId: string, conversationId: string) => {
  try {
    localStorage.removeItem(buildDraftStorageKey(userId, conversationId));
  } catch {
    // ignore localStorage failures
  }
};

const MessageCenterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, accessToken } = useAuth();
  const targetUserId = String(searchParams.get('userId') ?? '').trim();
  const targetConversationId = String(searchParams.get('conversationId') ?? '').trim();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeConversationIdRef = useRef('');
  const previousConversationIdRef = useRef('');
  const syncReadLockRef = useRef(new Set<string>());
  const socketMessageIdCacheRef = useRef(new Set<string>());
  const typingStopTimerRef = useRef<number | null>(null);
  const typingDisplayTimerRef = useRef<number | null>(null);
  const pendingScrollModeRef = useRef<'bottom' | 'preserve' | null>(null);
  const previousScrollHeightRef = useRef(0);

  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [messageTotal, setMessageTotal] = useState(0);
  const [draft, setDraft] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<MessageAttachmentPayload[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openingByUserId, setOpeningByUserId] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [updatingBlock, setUpdatingBlock] = useState(false);
  const [recallingMessageId, setRecallingMessageId] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [blockStatus, setBlockStatus] = useState<MessageBlockStatus | null>(null);
  const [pageError, setPageError] = useState('');
  const [messageError, setMessageError] = useState('');

  const emitTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!isAuthenticated || !accessToken || !conversationId) {
        return;
      }

      try {
        const socket = connectNotificationSocket(accessToken);
        socket.emit('private-message:typing', {
          conversationId,
          isTyping,
        });
      } catch {
        // ignore typing emit errors
      }
    },
    [accessToken, isAuthenticated],
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const previousConversationId = previousConversationIdRef.current;
    if (previousConversationId && previousConversationId !== activeConversationId) {
      emitTyping(previousConversationId, false);
    }

    previousConversationIdRef.current = activeConversationId;
    setIsPeerTyping(false);
  }, [activeConversationId, emitTyping]);

  useEffect(
    () => () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (typingDisplayTimerRef.current) {
        window.clearTimeout(typingDisplayTimerRef.current);
      }
      if (activeConversationIdRef.current) {
        emitTyping(activeConversationIdRef.current, false);
      }
    },
    [emitTyping],
  );

  const syncConversationRead = useCallback(async (conversationId: string) => {
    const normalizedConversationId = String(conversationId ?? '').trim();
    if (!normalizedConversationId) {
      return;
    }

    if (syncReadLockRef.current.has(normalizedConversationId)) {
      return;
    }

    syncReadLockRef.current.add(normalizedConversationId);
    try {
      await messageApi.markConversationRead(normalizedConversationId);
    } catch {
      // ignore sync errors to avoid breaking message flow
    } finally {
      syncReadLockRef.current.delete(normalizedConversationId);
    }
  }, []);

  const loadBlockStatus = useCallback(async (peerUserId: string) => {
    const normalizedPeerUserId = String(peerUserId ?? '').trim();
    if (!normalizedPeerUserId) {
      setBlockStatus(null);
      return;
    }

    try {
      const response = await messageApi.blockStatus(normalizedPeerUserId);
      const payload = extractData<Record<string, unknown>>(response, {});
      setBlockStatus(parseBlockStatus(payload));
    } catch (error) {
      setBlockStatus(null);
      setMessageError(getErrorMessage(error, '获取屏蔽状态失败'));
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setPageError('');

    try {
      const response = await messageApi.listConversations({ page: 1, limit: 100 });
      const list = extractList<Record<string, unknown>>(response)
        .map((item) => parseConversation(item))
        .filter((item): item is ConversationRecord => Boolean(item));

      setConversations(list);
      setActiveConversationId((prev) => {
        if (list.some((item) => item.id === prev)) {
          return prev;
        }
        return list[0]?.id ?? '';
      });
    } catch (error) {
      setConversations([]);
      setActiveConversationId('');
      setPageError(getErrorMessage(error, '会话列表加载失败'));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, page = 1, mode: 'replace' | 'prepend' = 'replace') => {
      if (!conversationId) {
        setMessages([]);
        setMessagePage(1);
        setMessageTotal(0);
        return;
      }

      if (mode === 'replace') {
        setLoadingMessages(true);
        setMessageError('');
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await messageApi.listMessages(conversationId, { page, limit: MESSAGE_PAGE_SIZE });
        const payload = extractData<Record<string, unknown>>(response, {});
        const list = extractList<Record<string, unknown>>(payload)
          .map((item) => parseMessage(item))
          .filter((item): item is MessageRecord => Boolean(item));

        const pagination = (payload.pagination && typeof payload.pagination === 'object'
          ? payload.pagination
          : {}) as Record<string, unknown>;
        const total = Math.max(0, Number(pagination.total ?? list.length) || list.length);

        setMessagePage(page);
        setMessageTotal(total);

        if (mode === 'replace') {
          pendingScrollModeRef.current = 'bottom';
          setMessages(list);
        } else {
          setMessages((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const older = list.filter((item) => !seen.has(item.id));
            return [...older, ...prev];
          });
        }

        setConversations((prev) => prev.map((item) => (item.id === conversationId ? { ...item, unreadCount: 0 } : item)));
      } catch (error) {
        if (mode === 'replace') {
          setMessages([]);
        }
        setMessageError(getErrorMessage(error, mode === 'replace' ? '私信记录加载失败' : '加载更早消息失败'));
      } finally {
        if (mode === 'replace') {
          setLoadingMessages(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void loadConversations();
  }, [isAuthenticated, loadConversations]);

  useEffect(() => {
    if (!isAuthenticated || !targetUserId) {
      return;
    }

    if (targetUserId === user?.id) {
      navigate('/messages', { replace: true });
      return;
    }

    let cancelled = false;

    const openByUserId = async () => {
      setOpeningByUserId(true);
      setPageError('');

      try {
        const response = await messageApi.openConversation({ userId: targetUserId });
        const payload = extractData<Record<string, unknown> | null>(response, null);
        const opened = parseConversation(payload);
        if (cancelled || !opened) {
          return;
        }

        setConversations((prev) => [opened, ...prev.filter((item) => item.id !== opened.id)]);
        setActiveConversationId(opened.id);
      } catch (error) {
        if (!cancelled) {
          setPageError(getErrorMessage(error, '创建会话失败'));
        }
      } finally {
        if (!cancelled) {
          setOpeningByUserId(false);
          navigate('/messages', { replace: true });
        }
      }
    };

    void openByUserId();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, navigate, targetUserId, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !targetConversationId || targetUserId) {
      return;
    }

    if (conversations.some((item) => item.id === targetConversationId)) {
      setActiveConversationId(targetConversationId);
      navigate('/messages', { replace: true });
    }
  }, [conversations, isAuthenticated, navigate, targetConversationId, targetUserId]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setMessagePage(1);
      setMessageTotal(0);
      setDraftAttachments([]);
      setBlockStatus(null);
      return;
    }

    setDraftAttachments([]);
    void loadMessages(activeConversationId, 1, 'replace');
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!user?.id || !activeConversationId) {
      setDraft('');
      return;
    }

    setDraft(readDraft(user.id, activeConversationId));
  }, [activeConversationId, user?.id]);

  useEffect(() => {
    if (!user?.id || !activeConversationId) {
      return;
    }
    writeDraft(user.id, activeConversationId, draft);
  }, [activeConversationId, draft, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const socket = connectNotificationSocket(accessToken);

    const handleConnect = () => {
      void loadConversations();
    };

    const handlePrivateMessage = (rawPayload: PrivateMessageSocketPayload) => {
      if (!rawPayload || typeof rawPayload !== 'object') {
        return;
      }

      const conversationId = String(rawPayload.conversationId ?? '').trim();
      const incoming = parseSocketMessage(rawPayload.message, rawPayload.sender);
      if (!conversationId || !incoming) {
        return;
      }

      if (socketMessageIdCacheRef.current.has(incoming.id)) {
        return;
      }
      socketMessageIdCacheRef.current.add(incoming.id);
      if (socketMessageIdCacheRef.current.size > 1000) {
        const firstId = socketMessageIdCacheRef.current.values().next().value;
        if (typeof firstId === 'string' && firstId) {
          socketMessageIdCacheRef.current.delete(firstId);
        }
      }

      const sender = parseUser(rawPayload.sender);
      const isActiveConversation = activeConversationIdRef.current === conversationId;
      const incomingPreview = buildMessagePreview(incoming.content, incoming.attachments);

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.id === conversationId);
        if (index < 0) {
          return [
            {
              id: conversationId,
              peer: sender,
              lastMessageContent: incomingPreview,
              lastMessageAt: incoming.createdAt,
              updatedAt: incoming.createdAt,
              unreadCount: isActiveConversation ? 0 : 1,
            },
            ...prev,
          ];
        }

        const current = prev[index];
        const nextConversation: ConversationRecord = {
          ...current,
          peer: sender.id ? sender : current.peer,
          lastMessageContent: incomingPreview || current.lastMessageContent,
          lastMessageAt: incoming.createdAt || current.lastMessageAt,
          updatedAt: incoming.createdAt || current.updatedAt,
          unreadCount: isActiveConversation ? 0 : current.unreadCount + 1,
        };

        return [nextConversation, ...prev.filter((item) => item.id !== conversationId)];
      });

      if (isActiveConversation) {
        pendingScrollModeRef.current = 'bottom';
        setMessages((prev) => {
          if (prev.some((item) => item.id === incoming.id)) {
            return prev;
          }
          return [...prev, incoming];
        });
        setMessageTotal((prev) => prev + 1);
        setIsPeerTyping(false);
        void syncConversationRead(conversationId);
      }
    };

    const handlePrivateTyping = (rawPayload: PrivateMessageTypingPayload) => {
      if (!rawPayload || typeof rawPayload !== 'object') {
        return;
      }

      const conversationId = String(rawPayload.conversationId ?? '').trim();
      if (!conversationId || conversationId !== activeConversationIdRef.current) {
        return;
      }

      const fromUserId = String(rawPayload.fromUserId ?? '').trim();
      if (fromUserId && fromUserId === String(user?.id ?? '').trim()) {
        return;
      }

      const isTyping = rawPayload.isTyping !== false;
      if (!isTyping) {
        setIsPeerTyping(false);
        if (typingDisplayTimerRef.current) {
          window.clearTimeout(typingDisplayTimerRef.current);
          typingDisplayTimerRef.current = null;
        }
        return;
      }

      setIsPeerTyping(true);
      if (typingDisplayTimerRef.current) {
        window.clearTimeout(typingDisplayTimerRef.current);
      }
      typingDisplayTimerRef.current = window.setTimeout(() => {
        setIsPeerTyping(false);
        typingDisplayTimerRef.current = null;
      }, TYPING_DISPLAY_TIMEOUT_MS);
    };

    const handlePrivateRecalled = (rawPayload: PrivateMessageRecalledPayload) => {
      if (!rawPayload || typeof rawPayload !== 'object') {
        return;
      }

      const conversationId = String(rawPayload.conversationId ?? '').trim();
      const messageId = String(rawPayload.messageId ?? '').trim();
      if (!conversationId || !messageId) {
        return;
      }

      const recalledContent = String(rawPayload.content ?? MESSAGE_RECALLED_CONTENT).trim() || MESSAGE_RECALLED_CONTENT;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId ? { ...item, content: recalledContent, attachments: [], isRecalled: true } : item,
        ),
      );

      const lastMessageContent = String(rawPayload.lastMessageContent ?? '').trim();
      const lastMessageAt = String(rawPayload.lastMessageAt ?? '').trim();

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                lastMessageContent: lastMessageContent || item.lastMessageContent,
                lastMessageAt: lastMessageAt || item.lastMessageAt,
                updatedAt: lastMessageAt || item.updatedAt,
              }
            : item,
        ),
      );
    };

    socket.on('connect', handleConnect);
    socket.on('private-message:new', handlePrivateMessage);
    socket.on('private-message:typing', handlePrivateTyping);
    socket.on('private-message:recalled', handlePrivateRecalled);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('private-message:new', handlePrivateMessage);
      socket.off('private-message:typing', handlePrivateTyping);
      socket.off('private-message:recalled', handlePrivateRecalled);
    };
  }, [accessToken, isAuthenticated, loadConversations, syncConversationRead, user?.id]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) {
      return;
    }

    if (pendingScrollModeRef.current === 'preserve') {
      container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
      pendingScrollModeRef.current = null;
      return;
    }

    container.scrollTop = container.scrollHeight;
    pendingScrollModeRef.current = null;
  }, [messages, activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    const peerUserId = String(activeConversation?.peer.id ?? '').trim();
    if (!peerUserId) {
      setBlockStatus(null);
      return;
    }

    void loadBlockStatus(peerUserId);
  }, [activeConversation?.peer.id, loadBlockStatus]);

  const hasMoreMessages = activeConversation ? messages.length < messageTotal : false;
  const canSendCurrentConversation = activeConversation ? (blockStatus?.canSend ?? true) : false;

  const canRecallMessage = useCallback(
    (item: MessageRecord) => {
      if (item.senderId !== user?.id || item.isRecalled) {
        return false;
      }
      const createdAt = new Date(item.createdAt).getTime();
      if (Number.isNaN(createdAt)) {
        return false;
      }
      return Date.now() - createdAt <= MESSAGE_RECALL_WINDOW_MS;
    },
    [user?.id],
  );

  const handleLoadMore = async () => {
    if (!activeConversationId || loadingMore || loadingMessages || !hasMoreMessages) {
      return;
    }

    const container = messageListRef.current;
    if (container) {
      previousScrollHeightRef.current = container.scrollHeight;
    }
    pendingScrollModeRef.current = 'preserve';
    await loadMessages(activeConversationId, messagePage + 1, 'prepend');
  };

  const handleRecall = async (messageId: string) => {
    const normalizedMessageId = String(messageId ?? '').trim();
    if (!normalizedMessageId || recallingMessageId) {
      return;
    }

    setRecallingMessageId(normalizedMessageId);
    setMessageError('');

    try {
      const response = await messageApi.recall(normalizedMessageId);
      const payload = extractData<Record<string, unknown>>(response, {});
      const recalled = parseMessage((payload as { message?: unknown }).message);
      if (recalled) {
        setMessages((prev) => prev.map((item) => (item.id === recalled.id ? recalled : item)));
      }
    } catch (error) {
      setMessageError(getErrorMessage(error, '消息撤回失败'));
    } finally {
      setRecallingMessageId('');
    }
  };

  const handleAttachmentFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }

    if (!activeConversationId) {
      setMessageError('请先选择会话');
      return;
    }

    if (uploadingAttachment) {
      return;
    }

    const remaining = MESSAGE_MAX_ATTACHMENTS - draftAttachments.length;
    if (remaining <= 0) {
      setMessageError(`最多可添加 ${MESSAGE_MAX_ATTACHMENTS} 个附件`);
      return;
    }

    const selectedFiles = files.slice(0, remaining);
    setUploadingAttachment(true);
    setMessageError('');

    try {
      const uploaded: MessageAttachmentPayload[] = [];
      for (const file of selectedFiles) {
        if (file.size > MESSAGE_MAX_ATTACHMENT_SIZE) {
          throw new Error(`附件 ${file.name} 超过 20MB 限制`);
        }

        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
        const formData = new FormData();
        formData.append('file', file);

        const response = isImage ? await messageApi.uploadImage(formData) : await messageApi.uploadFile(formData);
        const payload = extractData<Record<string, unknown>>(response, {});
        const url = String(payload.url ?? '').trim();
        if (!url) {
          throw new Error('附件上传失败，未返回有效地址');
        }

        const fileId = String(payload.fileId ?? '').trim();
        const name = String(payload.name ?? file.name).trim();
        const mime = String(payload.mime ?? file.type).trim();
        const size = Math.max(0, Number(payload.size ?? file.size) || file.size);
        uploaded.push({
          url,
          type: isImage ? 'image' : 'file',
          ...(fileId ? { fileId } : {}),
          ...(name ? { name } : {}),
          ...(size > 0 ? { size } : {}),
          ...(mime ? { mime } : {}),
        });
      }

      setDraftAttachments((prev) => [...prev, ...uploaded].slice(0, MESSAGE_MAX_ATTACHMENTS));
    } catch (error) {
      setMessageError(getErrorMessage(error, '附件上传失败'));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleRemoveDraftAttachment = (index: number) => {
    setDraftAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleToggleBlock = async () => {
    const peerUserId = String(activeConversation?.peer.id ?? '').trim();
    if (!peerUserId || updatingBlock) {
      return;
    }

    setUpdatingBlock(true);
    setMessageError('');

    try {
      if (blockStatus?.blockedByMe) {
        await messageApi.unblockUser(peerUserId);
      } else {
        const inputReason = window.prompt('可选：请输入屏蔽原因（最多 200 字）', '');
        if (inputReason === null) {
          return;
        }
        const reason = inputReason.trim().slice(0, 200);
        await messageApi.blockUser(peerUserId, reason ? { reason } : undefined);
      }
      await loadBlockStatus(peerUserId);
    } catch (error) {
      setMessageError(getErrorMessage(error, blockStatus?.blockedByMe ? '取消屏蔽失败' : '屏蔽用户失败'));
    } finally {
      setUpdatingBlock(false);
    }
  };

  const handleSend = async () => {
    const content = draft.trim();
    if ((!content && draftAttachments.length === 0) || !activeConversationId || sending || uploadingAttachment) {
      return;
    }

    if (!canSendCurrentConversation) {
      setMessageError(blockStatus?.blockedByMe ? '你已屏蔽该用户，解除后可继续发送' : '对方已屏蔽你，暂时无法发送');
      return;
    }

    if (content.length > MESSAGE_MAX_LENGTH) {
      setMessageError(`私信内容不能超过 ${MESSAGE_MAX_LENGTH} 字`);
      return;
    }

    setSending(true);
    setMessageError('');

    try {
      const response = await messageApi.send({
        conversationId: activeConversationId,
        ...(content ? { content } : {}),
        ...(draftAttachments.length > 0 ? { attachments: draftAttachments } : {}),
      });
      const payload = extractData<Record<string, unknown>>(response, {});
      const message = parseMessage((payload as { message?: unknown }).message);
      const conversation = parseConversation((payload as { conversation?: unknown }).conversation);

      if (message) {
        pendingScrollModeRef.current = 'bottom';
        setMessages((prev) => [...prev, message]);
        setMessageTotal((prev) => prev + 1);
      }

      if (conversation) {
        setConversations((prev) => [conversation, ...prev.filter((item) => item.id !== conversation.id)]);
        setActiveConversationId(conversation.id);
      }

      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      emitTyping(activeConversationId, false);
      setDraft('');
      setDraftAttachments([]);
      if (user?.id) {
        clearDraft(user.id, activeConversationId);
      }
    } catch (error) {
      setMessageError(getErrorMessage(error, '私信发送失败'));
    } finally {
      setSending(false);
    }
  };

  const handleDraftChange = (nextValue: string) => {
    const value = String(nextValue ?? '').slice(0, MESSAGE_MAX_LENGTH);
    setDraft(value);

    if (!activeConversationId || !canSendCurrentConversation) {
      return;
    }

    const hasContent = value.trim().length > 0;
    emitTyping(activeConversationId, hasContent);
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    if (hasContent) {
      typingStopTimerRef.current = window.setTimeout(() => {
        emitTyping(activeConversationId, false);
        typingStopTimerRef.current = null;
      }, TYPING_IDLE_TIMEOUT_MS);
    }
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleOpenAttachment = (url: string) => {
    if (!openSafeUrlInNewTab(url)) {
      setMessageError('附件地址无效');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="私信中心">
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: '300px minmax(0, 1fr)',
          }}
        >
          <section
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 12,
              display: 'grid',
              gap: 10,
              minHeight: 560,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-textSecondary)' }}>
              会话列表 {openingByUserId ? '（创建中）' : ''}
            </div>
            {loadingConversations ? <Loading text="会话加载中..." /> : null}
            {!loadingConversations && conversations.length === 0 ? <Empty description="暂无私信会话" /> : null}
            <div style={{ display: 'grid', gap: 8, overflowY: 'auto', maxHeight: 500 }}>
              {conversations.map((item) => {
                const isActive = item.id === activeConversationId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveConversationId(item.id)}
                    style={{
                      textAlign: 'left',
                      border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 10,
                      padding: 10,
                      background: isActive ? 'var(--color-primaryBg)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{getDisplayName(item.peer)}</strong>
                      {item.unreadCount > 0 ? (
                        <span className="status-chip" style={{ color: 'var(--color-primary)' }}>
                          未读 {item.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--color-textSecondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.lastMessageContent || '暂无消息'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>
                      {formatTime(item.lastMessageAt || item.updatedAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 12,
              display: 'grid',
              gap: 12,
              minHeight: 560,
              gridTemplateRows: 'auto minmax(0, 1fr) auto',
            }}
          >
            {activeConversation ? (
              <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong>{getDisplayName(activeConversation.peer)}</strong>
                  {blockStatus?.blockedByMe ? (
                    <span style={{ fontSize: 12, color: 'var(--color-error)' }}>你已屏蔽该用户</span>
                  ) : null}
                  {!blockStatus?.blockedByMe && blockStatus?.blockedMe ? (
                    <span style={{ fontSize: 12, color: 'var(--color-error)' }}>对方已屏蔽你，无法发送私信</span>
                  ) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: isPeerTyping ? 'var(--color-primary)' : 'var(--color-textSecondary)' }}>
                    {isPeerTyping ? '对方正在输入...' : `最近活跃：${formatTime(activeConversation.lastMessageAt || activeConversation.updatedAt)}`}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => void handleToggleBlock()} disabled={updatingBlock}>
                    {updatingBlock ? '处理中...' : blockStatus?.blockedByMe ? '取消屏蔽' : '屏蔽用户'}
                  </Button>
                </div>
              </header>
            ) : (
              <header style={{ fontSize: 14, color: 'var(--color-textSecondary)' }}>请选择一个会话</header>
            )}

            <div
              ref={messageListRef}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: 12,
                overflowY: 'auto',
                background: 'var(--color-surface)',
                display: 'grid',
                gap: 10,
              }}
            >
              {loadingMessages ? <Loading text="消息加载中..." /> : null}
              {!loadingMessages && activeConversation && hasMoreMessages ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void handleLoadMore()}>
                    {loadingMore ? '加载中...' : '加载更早消息'}
                  </Button>
                </div>
              ) : null}
              {!loadingMessages && activeConversation && messages.length === 0 ? <Empty description="还没有消息，开始打个招呼吧" /> : null}
              {!activeConversation ? <Empty description="请选择左侧会话查看私信" /> : null}
              {messages.map((item) => {
                const selfSent = item.senderId === user?.id;
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: selfSent ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '78%',
                        borderRadius: 10,
                        border: selfSent ? '1px solid var(--color-primaryLight)' : '1px solid var(--color-border)',
                        background: selfSent ? 'var(--color-primaryBg)' : 'var(--color-surface)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: 6,
                      }}
                    >
                      {item.isRecalled ? (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>消息已撤回</div>
                      ) : null}
                      {!item.isRecalled && item.content ? (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{item.content}</div>
                      ) : null}
                      {!item.isRecalled && item.attachments.length > 0 ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {item.attachments.map((attachment, index) => {
                            const isImage = attachment.type === 'image';
                            const imageSrc = isImage ? resolveSafeImageSrc(attachment.url ?? '') : '';
                            const fileLabel = attachment.name || attachment.fileId || '附件文件';
                            const fileSize = formatFileSize(attachment.size);

                            if (isImage && imageSrc) {
                              return (
                                <button
                                  key={`${item.id}-attachment-${index}`}
                                  type="button"
                                  onClick={() => handleOpenAttachment(attachment.url ?? '')}
                                  style={{
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 8,
                                    padding: 4,
                                    background: 'var(--color-background)',
                                    cursor: 'pointer',
                                    maxWidth: 220,
                                  }}
                                >
                                  <img
                                    src={imageSrc}
                                    alt={attachment.name || '消息图片'}
                                    style={{ display: 'block', width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6 }}
                                  />
                                </button>
                              );
                            }

                            return (
                              <button
                                key={`${item.id}-attachment-${index}`}
                                type="button"
                                onClick={() => handleOpenAttachment(attachment.url ?? '')}
                                style={{
                                  textAlign: 'left',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  background: 'var(--color-background)',
                                  cursor: 'pointer',
                                  display: 'grid',
                                  gap: 4,
                                }}
                              >
                                <strong style={{ fontSize: 13, lineHeight: 1.4 }}>{fileLabel}</strong>
                                {fileSize ? (
                                  <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>{fileSize}</span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>
                          {selfSent ? '我' : getDisplayName(item.sender)} · {formatTime(item.createdAt)}
                        </span>
                        {selfSent && canRecallMessage(item) ? (
                          <button
                            type="button"
                            onClick={() => void handleRecall(item.id)}
                            disabled={recallingMessageId === item.id}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--color-primary)',
                              cursor: recallingMessageId === item.id ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              padding: 0,
                            }}
                          >
                            {recallingMessageId === item.id ? '撤回中...' : '撤回'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {messageError ? (
                <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>
                  {messageError}
                </div>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(event) => void handleAttachmentFilesChange(event)}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.txt,.md,.json,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              {draftAttachments.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>待发送附件（{draftAttachments.length}/{MESSAGE_MAX_ATTACHMENTS}）</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {draftAttachments.map((attachment, index) => {
                      const isImage = attachment.type === 'image';
                      const imageSrc = isImage ? resolveSafeImageSrc(attachment.url ?? '') : '';
                      const name = attachment.name || attachment.fileId || '附件';
                      const sizeText = formatFileSize(attachment.size);

                      return (
                        <div
                          key={`draft-attachment-${index}`}
                          style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            padding: 8,
                            display: 'grid',
                            gap: 6,
                            background: 'var(--color-surface)',
                            width: isImage ? 132 : 180,
                          }}
                        >
                          {isImage && imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={name}
                              style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : null}
                          <div style={{ fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word' }}>{name}</div>
                          {sizeText ? <div style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>{sizeText}</div> : null}
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftAttachment(index)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--color-primary)',
                              textAlign: 'left',
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            移除附件
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <textarea
                className="textarea"
                rows={3}
                value={draft}
                onChange={(event) => handleDraftChange(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                disabled={!activeConversation || sending || uploadingAttachment || !canSendCurrentConversation}
                placeholder={
                  !activeConversation
                    ? '请先选择会话'
                    : blockStatus?.blockedByMe
                      ? '你已屏蔽该用户，可先解除屏蔽'
                      : blockStatus?.blockedMe
                        ? '对方已屏蔽你，暂无法发送私信'
                        : `给 ${getDisplayName(activeConversation.peer)} 发送私信（Ctrl/Cmd + Enter 发送）`
                }
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: draft.length >= MESSAGE_MAX_LENGTH ? 'var(--color-error)' : 'var(--color-textSecondary)',
                  }}
                >
                  {draft.length}/{MESSAGE_MAX_LENGTH}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      !activeConversation ||
                      sending ||
                      uploadingAttachment ||
                      !canSendCurrentConversation ||
                      draftAttachments.length >= MESSAGE_MAX_ATTACHMENTS
                    }
                  >
                    {uploadingAttachment ? '上传中...' : '添加附件'}
                  </Button>
                  <Button
                    onClick={() => void handleSend()}
                    disabled={
                      !activeConversation ||
                      sending ||
                      uploadingAttachment ||
                      !canSendCurrentConversation ||
                      (!draft.trim() && draftAttachments.length === 0)
                    }
                  >
                    {sending ? '发送中...' : '发送私信'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Card>

      {pageError ? (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {pageError}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default MessageCenterPage;
