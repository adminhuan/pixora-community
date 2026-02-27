import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import {
  emitNotification,
  emitNotificationCount,
  emitPrivateMessage,
  emitPrivateMessageCount,
  emitPrivateMessageRecalled,
} from './realtime.service';
import { sensitiveWordService } from './sensitiveWord.service';
import { AppError } from '../utils/AppError';
import { buildPagination } from '../utils/helpers';

const userSelect = {
  id: true,
  username: true,
  nickname: true,
  avatar: true,
} satisfies Prisma.UserSelect;

type ConversationWithUsers = Prisma.PrivateConversationGetPayload<{
  include: {
    userA: { select: typeof userSelect };
    userB: { select: typeof userSelect };
  };
}>;

type ConversationSummary = {
  id: string;
  peer: Prisma.UserGetPayload<{ select: typeof userSelect }>;
  lastMessageContent: string | null;
  lastMessageAt: Date | null;
  updatedAt: Date;
  unreadCount: number;
};

type MessageWithUsers = Prisma.PrivateMessageGetPayload<{
  include: {
    sender: { select: typeof userSelect };
    receiver: { select: typeof userSelect };
  };
}>;

type PrivateMessageAttachment = {
  url: string;
  type: 'image' | 'file';
  fileId?: string;
  name?: string;
  size?: number;
  mime?: string;
};

type MessagePayload = Omit<MessageWithUsers, 'attachments'> & {
  attachments: PrivateMessageAttachment[];
  isRecalled: boolean;
};

const PRIVATE_MESSAGE_RECALLED_CONTENT = '[消息已撤回]';
const PRIVATE_MESSAGE_RECALL_WINDOW_MS = 2 * 60 * 1000;
const PRIVATE_MESSAGE_MAX_ATTACHMENTS = 6;
const PRIVATE_MESSAGE_ATTACHMENT_MAX_NAME_LENGTH = 120;
const PRIVATE_MESSAGE_ATTACHMENT_MAX_URL_LENGTH = 500;
const PRIVATE_MESSAGE_ATTACHMENT_MAX_SIZE = 20 * 1024 * 1024;
const PRIVATE_MESSAGE_BLOCK_REASON_MAX_LENGTH = 200;

class MessageService {
  private normalizeAttachmentUrl(rawUrl: unknown): string {
    const value = String(rawUrl ?? '').trim();
    if (!value) {
      throw new AppError('附件地址不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (value.length > PRIVATE_MESSAGE_ATTACHMENT_MAX_URL_LENGTH) {
      throw new AppError('附件地址过长', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (/^https?:\/\/[^\s]+$/i.test(value)) {
      return value;
    }

    if (value.startsWith('/uploads/')) {
      return value;
    }

    if (value.startsWith('uploads/')) {
      return `/${value}`;
    }

    throw new AppError('附件地址无效', { statusCode: 400, code: 'BAD_REQUEST' });
  }

  private normalizeMessageAttachments(rawAttachments: unknown, strict = true): PrivateMessageAttachment[] {
    if (!Array.isArray(rawAttachments)) {
      return [];
    }

    if (strict && rawAttachments.length > PRIVATE_MESSAGE_MAX_ATTACHMENTS) {
      throw new AppError(`附件数量不能超过 ${PRIVATE_MESSAGE_MAX_ATTACHMENTS} 个`, {
        statusCode: 400,
        code: 'BAD_REQUEST',
      });
    }

    const normalized: PrivateMessageAttachment[] = [];
    const limited = rawAttachments.slice(0, PRIVATE_MESSAGE_MAX_ATTACHMENTS);

    limited.forEach((rawItem, index) => {
      if (!rawItem || typeof rawItem !== 'object') {
        if (strict) {
          throw new AppError(`附件格式无效（第 ${index + 1} 项）`, { statusCode: 400, code: 'BAD_REQUEST' });
        }
        return;
      }

      const item = rawItem as {
        url?: unknown;
        type?: unknown;
        fileId?: unknown;
        name?: unknown;
        size?: unknown;
        mime?: unknown;
      };

      let url = '';
      try {
        url = this.normalizeAttachmentUrl(item.url);
      } catch (error) {
        if (strict) {
          throw error;
        }
        return;
      }

      const rawType = String(item.type ?? '').trim().toLowerCase();
      const mime = String(item.mime ?? '').trim().slice(0, 100) || undefined;
      const inferredIsImage = Boolean(mime?.startsWith('image/')) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
      const type: 'image' | 'file' = rawType === 'image' || rawType === 'file' ? rawType : inferredIsImage ? 'image' : 'file';

      const fileId = String(item.fileId ?? '').trim().slice(0, 255) || undefined;
      const name = String(item.name ?? '')
        .trim()
        .slice(0, PRIVATE_MESSAGE_ATTACHMENT_MAX_NAME_LENGTH);
      const normalizedName = name || undefined;

      const rawSize = Number(item.size ?? 0);
      const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.floor(rawSize) : undefined;
      if (strict && size && size > PRIVATE_MESSAGE_ATTACHMENT_MAX_SIZE) {
        throw new AppError('附件大小超过限制', { statusCode: 400, code: 'BAD_REQUEST' });
      }

      normalized.push({
        url,
        type,
        ...(fileId ? { fileId } : {}),
        ...(normalizedName ? { name: normalizedName } : {}),
        ...(size ? { size } : {}),
        ...(mime ? { mime } : {}),
      });
    });

    return normalized;
  }

  private buildMessagePreview(content: string, attachments: PrivateMessageAttachment[]): string {
    if (content) {
      return content;
    }

    if (attachments.length === 0) {
      return '';
    }

    if (attachments.length === 1) {
      const attachment = attachments[0];
      if (attachment.type === 'image') {
        return '[图片]';
      }

      if (attachment.name) {
        return `[文件] ${attachment.name}`;
      }

      return '[文件]';
    }

    const imageCount = attachments.filter((item) => item.type === 'image').length;
    if (imageCount === attachments.length) {
      return `[图片] 共 ${attachments.length} 张`;
    }

    return `[附件] 共 ${attachments.length} 个`;
  }

  private normalizeBlockReason(reason: unknown): string | null {
    const normalizedReason = String(reason ?? '')
      .trim()
      .slice(0, PRIVATE_MESSAGE_BLOCK_REASON_MAX_LENGTH);
    return normalizedReason || null;
  }

  private async ensureCanSendMessage(senderId: string, receiverId: string) {
    const blockRecord = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
      select: {
        blockerId: true,
      },
    });

    if (!blockRecord) {
      return;
    }

    if (blockRecord.blockerId === senderId) {
      throw new AppError('你已屏蔽该用户，解除屏蔽后可发送私信', {
        statusCode: 400,
        code: 'MESSAGE_BLOCKED_BY_SELF',
      });
    }

    throw new AppError('对方已屏蔽你，无法发送私信', {
      statusCode: 403,
      code: 'MESSAGE_BLOCKED_BY_PEER',
    });
  }

  private normalizePair(userId: string, peerUserId: string) {
    const normalizedUserId = String(userId ?? '').trim();
    const normalizedPeerId = String(peerUserId ?? '').trim();

    if (!normalizedUserId || !normalizedPeerId) {
      throw new AppError('用户 ID 无效', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (normalizedUserId === normalizedPeerId) {
      throw new AppError('不能给自己发送私信', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const [userAId, userBId] = [normalizedUserId, normalizedPeerId].sort((a, b) => a.localeCompare(b));
    return {
      pairKey: `${userAId}:${userBId}`,
      userAId,
      userBId,
    };
  }

  private toConversationSummary(
    currentUserId: string,
    conversation: ConversationWithUsers,
    unreadCount = 0,
  ): ConversationSummary {
    const peer = conversation.userAId === currentUserId ? conversation.userB : conversation.userA;

    return {
      id: conversation.id,
      peer,
      lastMessageContent: conversation.lastMessageContent,
      lastMessageAt: conversation.lastMessageAt,
      updatedAt: conversation.updatedAt,
      unreadCount,
    };
  }

  private toMessagePayload(message: MessageWithUsers): MessagePayload {
    const attachments = this.normalizeMessageAttachments(message.attachments, false);
    return {
      ...message,
      attachments,
      isRecalled: message.content === PRIVATE_MESSAGE_RECALLED_CONTENT,
    };
  }

  private async findConversationForUser(currentUserId: string, conversationId: string) {
    const conversation = await prisma.privateConversation.findUnique({
      where: { id: conversationId },
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
      },
    });

    if (!conversation) {
      throw new AppError('会话不存在', { statusCode: 404, code: 'CONVERSATION_NOT_FOUND' });
    }

    if (conversation.userAId !== currentUserId && conversation.userBId !== currentUserId) {
      throw new AppError('无权访问该会话', { statusCode: 403, code: 'FORBIDDEN' });
    }

    return conversation;
  }

  private async ensureUserAvailable(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user) {
      throw new AppError('目标用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }

    if (user.status === 'banned') {
      throw new AppError('目标用户不可用', { statusCode: 400, code: 'BAD_REQUEST' });
    }
  }

  async openConversation(currentUserId: string, peerUserId: string) {
    const targetUserId = String(peerUserId ?? '').trim();
    const { pairKey, userAId, userBId } = this.normalizePair(currentUserId, targetUserId);
    await this.ensureUserAvailable(targetUserId);

    const conversation = await prisma.privateConversation.upsert({
      where: { pairKey },
      create: {
        pairKey,
        userAId,
        userBId,
      },
      update: {},
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
      },
    });

    const unreadCount = await prisma.privateMessage.count({
      where: {
        conversationId: conversation.id,
        receiverId: currentUserId,
        isRead: false,
      },
    });

    return this.toConversationSummary(currentUserId, conversation, unreadCount);
  }

  async listConversations(currentUserId: string, query: { page?: string | number; limit?: string | number }) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const where: Prisma.PrivateConversationWhereInput = {
      OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
    };

    const [total, rows] = await Promise.all([
      prisma.privateConversation.count({ where }),
      prisma.privateConversation.findMany({
        where,
        include: {
          userA: { select: userSelect },
          userB: { select: userSelect },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const conversationIds = rows.map((item) => item.id);
    const unreadRows =
      conversationIds.length > 0
        ? await prisma.privateMessage.groupBy({
            by: ['conversationId'],
            where: {
              conversationId: { in: conversationIds },
              receiverId: currentUserId,
              isRead: false,
            },
            _count: {
              _all: true,
            },
          })
        : [];

    const unreadMap = new Map<string, number>(
      unreadRows.map((item) => [item.conversationId, Number(item._count._all ?? 0)]),
    );

    return {
      data: rows.map((item) => this.toConversationSummary(currentUserId, item, unreadMap.get(item.id) ?? 0)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async listMessages(
    currentUserId: string,
    conversationId: string,
    query: { page?: string | number; limit?: string | number },
  ) {
    const conversation = await this.findConversationForUser(currentUserId, conversationId);
    const parsedPage = Math.max(Number(query.page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(query.limit) || 30, 1), 50);
    const page = parsedPage;
    const limit = parsedLimit;
    const skip = (page - 1) * limit;

    const now = new Date();
    await prisma.privateMessage.updateMany({
      where: {
        conversationId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: now,
      },
    });

    await prisma.notification.updateMany({
      where: {
        recipientId: currentUserId,
        type: 'private_message',
        targetType: 'private_message',
        targetId: conversationId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const [privateUnreadCount, notificationUnreadCount] = await Promise.all([
      prisma.privateMessage.count({
        where: {
          receiverId: currentUserId,
          isRead: false,
        },
      }),
      prisma.notification.count({
        where: {
          recipientId: currentUserId,
          isRead: false,
        },
      }),
    ]);

    emitPrivateMessageCount(currentUserId, privateUnreadCount);
    emitNotificationCount(currentUserId, notificationUnreadCount);

    const where: Prisma.PrivateMessageWhereInput = { conversationId };
    const [total, rows] = await Promise.all([
      prisma.privateMessage.count({ where }),
      prisma.privateMessage.findMany({
        where,
        include: {
          sender: { select: userSelect },
          receiver: { select: userSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      conversation: this.toConversationSummary(currentUserId, conversation, 0),
      data: rows.reverse().map((item) => this.toMessagePayload(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async sendMessage(
    currentUserId: string,
    payload: { content?: string; toUserId?: string; conversationId?: string; attachments?: unknown },
  ): Promise<{ conversation: ConversationSummary; message: MessagePayload }> {
    const content = String(payload.content ?? '').trim();
    const attachments = this.normalizeMessageAttachments(payload.attachments);
    if (!content && attachments.length === 0) {
      throw new AppError('私信内容和附件不能同时为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (content) {
      const sensitiveResult = sensitiveWordService.check(content);
      if (sensitiveResult.hit) {
        throw new AppError('私信内容包含敏感词，请调整后重试', {
          statusCode: 400,
          code: 'CONTENT_SENSITIVE',
          details: { word: sensitiveResult.word ?? '' },
        });
      }
    }

    let conversation: ConversationWithUsers;
    let receiverId = '';

    if (payload.conversationId) {
      conversation = await this.findConversationForUser(currentUserId, String(payload.conversationId));
      receiverId = conversation.userAId === currentUserId ? conversation.userBId : conversation.userAId;
    } else {
      const targetUserId = String(payload.toUserId ?? '').trim();
      const { pairKey, userAId, userBId } = this.normalizePair(currentUserId, targetUserId);
      await this.ensureUserAvailable(targetUserId);

      conversation = await prisma.privateConversation.upsert({
        where: { pairKey },
        create: {
          pairKey,
          userAId,
          userBId,
        },
        update: {},
        include: {
          userA: { select: userSelect },
          userB: { select: userSelect },
        },
      });

      receiverId = targetUserId;
    }

    await this.ensureUserAvailable(receiverId);
    await this.ensureCanSendMessage(currentUserId, receiverId);

    const now = new Date();
    const contentPreview = this.buildMessagePreview(content, attachments);

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.privateMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUserId,
          receiverId,
          content,
          attachments: attachments.length > 0 ? (attachments as Prisma.InputJsonValue) : undefined,
        },
        include: {
          sender: { select: userSelect },
          receiver: { select: userSelect },
        },
      });

      await tx.privateConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageContent: contentPreview.slice(0, 500),
          lastMessageAt: now,
          updatedAt: now,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: receiverId,
          senderId: currentUserId,
          type: 'private_message',
          targetType: 'private_message',
          targetId: conversation.id,
          content: contentPreview.slice(0, 120),
        },
      });

      return created;
    });
    const messagePayload = this.toMessagePayload(message);

    const freshConversation = await this.findConversationForUser(currentUserId, conversation.id);

    const [receiverPrivateUnreadCount, receiverNotificationUnreadCount] = await Promise.all([
      prisma.privateMessage.count({
        where: {
          receiverId,
          isRead: false,
        },
      }),
      prisma.notification.count({
        where: {
          recipientId: receiverId,
          isRead: false,
        },
      }),
    ]);

    emitPrivateMessage(receiverId, {
      conversationId: conversation.id,
      message: {
        id: messagePayload.id,
        senderId: messagePayload.senderId,
        receiverId: messagePayload.receiverId,
        content: messagePayload.content,
        attachments: messagePayload.attachments,
        createdAt: messagePayload.createdAt,
        isRecalled: false,
      },
      sender: messagePayload.sender,
    });
    emitPrivateMessageCount(receiverId, receiverPrivateUnreadCount);
    emitNotification(receiverId, {
      title: `来自 ${messagePayload.sender.nickname || messagePayload.sender.username} 的私信`,
      content: contentPreview.slice(0, 120),
      type: 'private_message',
      targetType: 'private_message',
      targetId: conversation.id,
      createdAt: messagePayload.createdAt,
      sender: messagePayload.sender,
    });
    emitNotificationCount(receiverId, receiverNotificationUnreadCount);

    return {
      conversation: this.toConversationSummary(currentUserId, freshConversation, 0),
      message: messagePayload,
    };
  }

  async recallMessage(currentUserId: string, messageId: string) {
    const normalizedMessageId = String(messageId ?? '').trim();
    if (!normalizedMessageId) {
      throw new AppError('消息 ID 无效', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const message = await prisma.privateMessage.findUnique({
      where: { id: normalizedMessageId },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
    });

    if (!message) {
      throw new AppError('消息不存在', { statusCode: 404, code: 'MESSAGE_NOT_FOUND' });
    }

    if (message.senderId !== currentUserId) {
      throw new AppError('仅发送者可撤回消息', { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (message.content === PRIVATE_MESSAGE_RECALLED_CONTENT) {
      return {
        conversationId: message.conversationId,
        message: this.toMessagePayload(message),
      };
    }

    if (Date.now() - message.createdAt.getTime() > PRIVATE_MESSAGE_RECALL_WINDOW_MS) {
      throw new AppError('消息发送超过 2 分钟，无法撤回', { statusCode: 400, code: 'MESSAGE_RECALL_EXPIRED' });
    }

    const recalledMessagePreview = this.buildMessagePreview(
      String(message.content ?? '').trim(),
      this.normalizeMessageAttachments(message.attachments, false),
    );

    const recalledMessage = await prisma.$transaction(async (tx) => {
      const updatedMessage = await tx.privateMessage.update({
        where: { id: normalizedMessageId },
        data: {
          content: PRIVATE_MESSAGE_RECALLED_CONTENT,
          attachments: Prisma.JsonNull,
        },
        include: {
          sender: { select: userSelect },
          receiver: { select: userSelect },
        },
      });

      const latestMessage = await tx.privateMessage.findFirst({
        where: { conversationId: updatedMessage.conversationId },
        select: { content: true, attachments: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      const latestMessagePreview = latestMessage
        ? this.buildMessagePreview(
            String(latestMessage.content ?? '').trim(),
            this.normalizeMessageAttachments(latestMessage.attachments, false),
          )
        : null;

      await tx.privateConversation.update({
        where: { id: updatedMessage.conversationId },
        data: {
          lastMessageContent: latestMessagePreview?.slice(0, 500) ?? null,
          lastMessageAt: latestMessage?.createdAt ?? null,
        },
      });

      const notificationWhere: Prisma.NotificationWhereInput = {
        recipientId: updatedMessage.receiverId,
        type: 'private_message',
        targetType: 'private_message',
        targetId: updatedMessage.conversationId,
      };
      if (recalledMessagePreview) {
        notificationWhere.content = { contains: recalledMessagePreview.slice(0, 120) };
      }

      await tx.notification.updateMany({
        where: notificationWhere,
        data: {
          content: '消息已撤回',
        },
      });

      return {
        updatedMessage,
        latestMessage,
        latestMessagePreview,
      };
    });

    const eventPayload = {
      conversationId: recalledMessage.updatedMessage.conversationId,
      messageId: recalledMessage.updatedMessage.id,
      content: PRIVATE_MESSAGE_RECALLED_CONTENT,
      lastMessageContent: recalledMessage.latestMessagePreview?.slice(0, 500) ?? '',
      lastMessageAt: recalledMessage.latestMessage?.createdAt?.toISOString() ?? '',
      recalledAt: new Date().toISOString(),
    };

    emitPrivateMessageRecalled(recalledMessage.updatedMessage.senderId, eventPayload);
    emitPrivateMessageRecalled(recalledMessage.updatedMessage.receiverId, eventPayload);

    return {
      conversationId: recalledMessage.updatedMessage.conversationId,
      message: this.toMessagePayload(recalledMessage.updatedMessage),
    };
  }

  async markConversationRead(currentUserId: string, conversationId: string) {
    await this.findConversationForUser(currentUserId, conversationId);
    const now = new Date();

    const [messageUpdateResult] = await prisma.$transaction([
      prisma.privateMessage.updateMany({
        where: {
          conversationId,
          receiverId: currentUserId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      }),
      prisma.notification.updateMany({
        where: {
          recipientId: currentUserId,
          type: 'private_message',
          targetType: 'private_message',
          targetId: conversationId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      }),
    ]);

    const [privateUnreadCount, notificationUnreadCount] = await Promise.all([
      prisma.privateMessage.count({
        where: {
          receiverId: currentUserId,
          isRead: false,
        },
      }),
      prisma.notification.count({
        where: {
          recipientId: currentUserId,
          isRead: false,
        },
      }),
    ]);

    emitPrivateMessageCount(currentUserId, privateUnreadCount);
    emitNotificationCount(currentUserId, notificationUnreadCount);

    return {
      updated: messageUpdateResult.count,
    };
  }

  async blockUser(currentUserId: string, targetUserId: string, reason?: string) {
    const normalizedTargetUserId = String(targetUserId ?? '').trim();
    if (!normalizedTargetUserId) {
      throw new AppError('目标用户不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (normalizedTargetUserId === currentUserId) {
      throw new AppError('不能屏蔽自己', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    await this.ensureUserAvailable(normalizedTargetUserId);
    const normalizedReason = this.normalizeBlockReason(reason);

    const record = await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: normalizedTargetUserId,
        },
      },
      create: {
        blockerId: currentUserId,
        blockedId: normalizedTargetUserId,
        reason: normalizedReason,
      },
      update: {
        reason: normalizedReason,
      },
    });

    return {
      userId: record.blockedId,
      blocked: true,
      reason: record.reason ?? null,
    };
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    const normalizedTargetUserId = String(targetUserId ?? '').trim();
    if (!normalizedTargetUserId) {
      throw new AppError('目标用户不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    await this.ensureUserAvailable(normalizedTargetUserId);

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: normalizedTargetUserId,
      },
    });

    return {
      userId: normalizedTargetUserId,
      blocked: false,
    };
  }

  async blockStatus(currentUserId: string, targetUserId: string) {
    const normalizedTargetUserId = String(targetUserId ?? '').trim();
    if (!normalizedTargetUserId) {
      throw new AppError('目标用户不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (normalizedTargetUserId === currentUserId) {
      return {
        userId: normalizedTargetUserId,
        blockedByMe: false,
        blockedMe: false,
        canSend: false,
        reason: null,
      };
    }

    await this.ensureUserAvailable(normalizedTargetUserId);

    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: currentUserId,
            blockedId: normalizedTargetUserId,
          },
        },
      }),
      prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: normalizedTargetUserId,
            blockedId: currentUserId,
          },
        },
      }),
    ]);

    return {
      userId: normalizedTargetUserId,
      blockedByMe: Boolean(blockedByMe),
      blockedMe: Boolean(blockedMe),
      canSend: !blockedByMe && !blockedMe,
      reason: blockedByMe?.reason ?? null,
    };
  }

  async unreadCount(currentUserId: string) {
    return prisma.privateMessage.count({
      where: {
        receiverId: currentUserId,
        isRead: false,
      },
    });
  }
}

export const messageService = new MessageService();
