import { ContentType, Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';

type TransactionClient = Prisma.TransactionClient;

const ensureContentExists = async (tx: TransactionClient, targetType: ContentType, targetId: string): Promise<void> => {
  let exists = false;
  switch (targetType) {
    case 'post':
      exists = Boolean(await tx.post.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'blog':
      exists = Boolean(await tx.blog.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'project':
      exists = Boolean(await tx.project.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'snippet':
      exists = Boolean(await tx.codeSnippet.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'question':
      exists = Boolean(await tx.question.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'answer':
      exists = Boolean(await tx.answer.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'comment':
      exists = Boolean(await tx.comment.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    default:
      exists = false;
  }

  if (!exists) {
    throw new AppError('目标内容不存在', { statusCode: 404, code: 'TARGET_NOT_FOUND' });
  }
};

const incrementLikeCount = async (
  tx: TransactionClient,
  targetType: ContentType,
  targetId: string,
  delta: 1 | -1
): Promise<void> => {
  switch (targetType) {
    case 'post':
      await tx.post.update({ where: { id: targetId }, data: { likeCount: { increment: delta } } });
      return;
    case 'blog':
      await tx.blog.update({ where: { id: targetId }, data: { likeCount: { increment: delta } } });
      return;
    case 'project':
      await tx.project.update({ where: { id: targetId }, data: { likeCount: { increment: delta } } });
      return;
    case 'snippet':
      await tx.codeSnippet.update({ where: { id: targetId }, data: { likeCount: { increment: delta } } });
      return;
    case 'question':
      await tx.question.update({ where: { id: targetId }, data: { voteCount: { increment: delta } } });
      return;
    case 'answer':
      await tx.answer.update({ where: { id: targetId }, data: { voteCount: { increment: delta } } });
      return;
    case 'comment':
      await tx.comment.update({ where: { id: targetId }, data: { likeCount: { increment: delta } } });
      return;
    default:
      throw new AppError('不支持的点赞目标类型', { statusCode: 400, code: 'UNSUPPORTED_TARGET_TYPE' });
  }
};

const incrementFavoriteCount = async (
  tx: TransactionClient,
  targetType: ContentType,
  targetId: string,
  delta: 1 | -1
): Promise<void> => {
  switch (targetType) {
    case 'post':
      await tx.post.update({ where: { id: targetId }, data: { favoriteCount: { increment: delta } } });
      return;
    case 'blog':
      await tx.blog.update({ where: { id: targetId }, data: { favoriteCount: { increment: delta } } });
      return;
    case 'project':
      await tx.project.update({ where: { id: targetId }, data: { favoriteCount: { increment: delta } } });
      return;
    case 'snippet':
      await tx.codeSnippet.update({ where: { id: targetId }, data: { favoriteCount: { increment: delta } } });
      return;
    default:
      throw new AppError('不支持的收藏目标类型', { statusCode: 400, code: 'UNSUPPORTED_TARGET_TYPE' });
  }
};

export const incrementCommentCount = async (
  tx: TransactionClient,
  targetType: ContentType,
  targetId: string,
  delta: 1 | -1
): Promise<void> => {
  switch (targetType) {
    case 'post':
      await tx.post.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
      return;
    case 'blog':
      await tx.blog.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
      return;
    case 'project':
      await tx.project.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
      return;
    case 'snippet':
      await tx.codeSnippet.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
      return;
    case 'question':
      return;
    case 'answer':
      await tx.answer.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
      return;
    default:
      throw new AppError('不支持的评论目标类型', { statusCode: 400, code: 'UNSUPPORTED_TARGET_TYPE' });
  }
};

export const toggleLike = async (
  userId: string,
  targetType: ContentType,
  targetId: string
): Promise<{ liked: boolean }> => {
  return prisma.$transaction(async (tx) => {
    await ensureContentExists(tx, targetType, targetId);

    const existing = await tx.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId
        }
      }
    });

    if (existing) {
      await tx.like.delete({ where: { id: existing.id } });
      await incrementLikeCount(tx, targetType, targetId, -1);
      return { liked: false };
    }

    await tx.like.create({
      data: {
        userId,
        targetType,
        targetId
      }
    });
    await incrementLikeCount(tx, targetType, targetId, 1);
    return { liked: true };
  });
};

export const toggleFavorite = async (
  userId: string,
  targetType: ContentType,
  targetId: string,
  folderId?: string
): Promise<{ favorited: boolean }> => {
  return prisma.$transaction(async (tx) => {
    await ensureContentExists(tx, targetType, targetId);

    const existing = await tx.favorite.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId
        }
      }
    });

    if (existing) {
      await tx.favorite.delete({ where: { id: existing.id } });
      await incrementFavoriteCount(tx, targetType, targetId, -1);
      return { favorited: false };
    }

    await tx.favorite.create({
      data: {
        userId,
        targetType,
        targetId,
        folderId
      }
    });
    await incrementFavoriteCount(tx, targetType, targetId, 1);
    return { favorited: true };
  });
};
