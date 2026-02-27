import { CommentStatus, ContentType, Prisma, ReportReason } from '@prisma/client';
import prisma from '../config/database';
import { AuthUser } from '../types/common';
import { AppError } from '../utils/AppError';
import { buildPagination, markdownToHtml } from '../utils/helpers';
import { incrementCommentCount, toggleLike } from './interaction.service';
import { moderationService } from './moderation.service';
import { sensitiveWordService } from './sensitiveWord.service';

const commentInclude = {
  author: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true
    }
  }
} satisfies Prisma.CommentInclude;

const parseContentType = (value: unknown): ContentType => {
  const text = String(value ?? '').trim();
  if (['post', 'blog', 'project', 'snippet', 'question', 'answer', 'comment'].includes(text)) {
    return text as ContentType;
  }
  throw new AppError('不支持的评论目标类型', { statusCode: 400, code: 'INVALID_TARGET_TYPE' });
};

class CommentService {
  private async canReadTarget(
    targetType: ContentType,
    targetId: string,
    currentUser?: AuthUser,
    depth = 0
  ): Promise<boolean> {
    if (!targetId) {
      return false;
    }

    if (depth > 4) {
      return false;
    }

    if (targetType === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { authorId: true, status: true }
      });

      if (!post) {
        return false;
      }

      if (post.status === 'published') {
        return true;
      }

      if (!currentUser) {
        return false;
      }

      return currentUser.role === 'admin' || currentUser.id === post.authorId;
    }

    if (targetType === 'blog') {
      const blog = await prisma.blog.findUnique({
        where: { id: targetId },
        select: { authorId: true, status: true }
      });

      if (!blog) {
        return false;
      }

      if (blog.status === 'published') {
        return true;
      }

      if (!currentUser) {
        return false;
      }

      return currentUser.role === 'admin' || currentUser.id === blog.authorId;
    }

    if (targetType === 'snippet') {
      const snippet = await prisma.codeSnippet.findUnique({
        where: { id: targetId },
        select: { authorId: true, visibility: true }
      });

      if (!snippet) {
        return false;
      }

      if (snippet.visibility === 'public') {
        return true;
      }

      if (!currentUser) {
        return false;
      }

      return currentUser.role === 'admin' || currentUser.id === snippet.authorId;
    }

    if (targetType === 'project') {
      const project = await prisma.project.findUnique({ where: { id: targetId }, select: { id: true } });
      return Boolean(project);
    }

    if (targetType === 'question') {
      const question = await prisma.question.findUnique({ where: { id: targetId }, select: { id: true } });
      return Boolean(question);
    }

    if (targetType === 'answer') {
      const answer = await prisma.answer.findUnique({ where: { id: targetId }, select: { id: true } });
      return Boolean(answer);
    }

    if (targetType === 'comment') {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          status: true,
          authorId: true,
          targetType: true,
          targetId: true
        }
      });

      if (!comment || comment.status !== 'active') {
        return false;
      }

      if (currentUser && (currentUser.role === 'admin' || currentUser.id === comment.authorId)) {
        return true;
      }

      return this.canReadTarget(comment.targetType, comment.targetId, currentUser, depth + 1);
    }

    return false;
  }

  async list(
    query: {
      page?: string | number;
      limit?: string | number;
      targetType?: string;
      targetId?: string;
      status?: string;
    },
    currentUser?: AuthUser
  ) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);

    const targetTypeText = String(query.targetType ?? '').trim();
    const targetId = String(query.targetId ?? '').trim();

    if (!targetTypeText || !targetId) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1
        }
      };
    }

    const targetType = parseContentType(targetTypeText);
    const readable = await this.canReadTarget(targetType, targetId, currentUser);

    if (!readable) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1
        }
      };
    }

    const where: Prisma.CommentWhereInput = {
      targetType,
      targetId,
      status: 'active'
    };

    if (currentUser?.role === 'admin' && query.status && ['active', 'deleted', 'hidden'].includes(query.status)) {
      where.status = query.status as 'active' | 'deleted' | 'hidden';
    }

    const [data, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: commentInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  async detail(id: string, currentUser?: AuthUser) {
    const comment = await prisma.comment.findUnique({ where: { id }, include: commentInclude });

    if (!comment) {
      return null;
    }

    if (comment.status !== 'active') {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== comment.authorId)) {
        return null;
      }
    }

    const readable = await this.canReadTarget(comment.targetType, comment.targetId, currentUser);
    if (!readable) {
      return null;
    }

    return comment;
  }

  async findById(id: string) {
    return prisma.comment.findUnique({ where: { id } });
  }

  async createComment(payload: Record<string, unknown>, currentUser: AuthUser) {
    const targetType = parseContentType(payload.targetType);
    const targetId = String(payload.targetId ?? '').trim();
    const content = String(payload.content ?? '').trim();

    if (!targetId) {
      throw new AppError('目标 ID 不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    if (!content) {
      throw new AppError('评论内容不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const readable = await this.canReadTarget(targetType, targetId, currentUser);
    if (!readable) {
      throw new AppError('目标内容不存在', { statusCode: 404, code: 'TARGET_NOT_FOUND' });
    }

    const parentCommentId = String(payload.parentId ?? payload.replyToId ?? payload.replyTo ?? '').trim();

    let parentComment: {
      id: string;
      targetType: ContentType;
      targetId: string;
      rootId: string | null;
      status: string;
    } | null = null;

    if (parentCommentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: {
          id: true,
          targetType: true,
          targetId: true,
          rootId: true,
          status: true
        }
      });

      if (!parentComment || parentComment.status !== 'active') {
        throw new AppError('回复目标不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
      }

      if (parentComment.targetType !== targetType || parentComment.targetId !== targetId) {
        throw new AppError('回复目标与评论目标不一致', { statusCode: 400, code: 'BAD_REQUEST' });
      }
    }

    const modResult = await moderationService.moderate('comment', null, content);
    if (modResult.blocked) {
      throw new AppError(modResult.blockReason ?? '内容审核未通过', {
        statusCode: 403,
        code: 'CONTENT_BLOCKED',
        details: { reason: modResult.blockReason }
      });
    }

    const commentStatus = modResult.status as CommentStatus;
    const isPending = commentStatus === 'pending';

    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          content,
          contentHtml: markdownToHtml(content),
          targetType,
          targetId,
          parentId: parentComment?.id,
          rootId: parentComment ? (parentComment.rootId ?? parentComment.id) : undefined,
          replyToId: parentComment?.id,
          status: commentStatus,
          author: {
            connect: {
              id: currentUser.id
            }
          }
        },
        include: commentInclude
      });

      // Only increment counts when not pending
      if (!isPending) {
        await incrementCommentCount(tx, targetType, targetId, 1);

        if (parentComment?.id) {
          await tx.comment.update({
            where: { id: parentComment.id },
            data: {
              replyCount: {
                increment: 1
              }
            }
          });
        }
      }

      return comment;
    });
  }

  async updateComment(id: string, content: string) {
    const sensitiveResult = sensitiveWordService.check(content);
    if (sensitiveResult.hit) {
      throw new AppError(`内容包含敏感词：${sensitiveResult.word ?? ''}`, {
        statusCode: 403,
        code: 'CONTENT_BLOCKED',
        details: { reason: `内容包含敏感词：${sensitiveResult.word ?? ''}` }
      });
    }

    try {
      return await prisma.comment.update({
        where: { id },
        data: {
          content,
          contentHtml: markdownToHtml(content)
        },
        include: commentInclude
      });
    } catch {
      return null;
    }
  }

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({ where: { id } });
      if (!comment) {
        return false;
      }

      if (comment.status !== 'deleted') {
        await tx.comment.update({
          where: { id },
          data: {
            status: 'deleted'
          }
        });

        await incrementCommentCount(tx, comment.targetType, comment.targetId, -1);

        if (comment.parentId) {
          await tx.comment.update({
            where: { id: comment.parentId },
            data: {
              replyCount: {
                decrement: 1
              }
            }
          });
        }
      }

      return true;
    });
  }

  async like(id: string, currentUser: AuthUser) {
    const accessible = await this.detail(id, currentUser);
    if (!accessible) {
      return {
        liked: false,
        comment: null
      };
    }

    const liked = await toggleLike(currentUser.id, 'comment', id);
    const comment = await this.detail(id, currentUser);

    return {
      ...liked,
      comment
    };
  }

  async replies(id: string, currentUser?: AuthUser) {
    const parent = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        targetType: true,
        targetId: true
      }
    });

    if (!parent || parent.status !== 'active') {
      return [];
    }

    const readable = await this.canReadTarget(parent.targetType, parent.targetId, currentUser);
    if (!readable) {
      return [];
    }

    return prisma.comment.findMany({
      where: {
        parentId: id,
        status: 'active'
      },
      include: commentInclude,
      orderBy: { createdAt: 'asc' }
    });
  }

  async report(id: string, currentUser: AuthUser, reason: string, description?: string) {
    const normalizedReason = ['spam', 'abuse', 'inappropriate', 'copyright', 'other'].includes(reason)
      ? (reason as ReportReason)
      : 'other';

    const comment = await this.detail(id, currentUser);
    if (!comment) {
      throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    }

    if (comment.authorId === currentUser.id) {
      throw new AppError('不能举报自己的评论', { statusCode: 400, code: 'INVALID_REPORT_TARGET' });
    }

    const pending = await prisma.report.findFirst({
      where: {
        reporterId: currentUser.id,
        targetType: 'comment',
        targetId: id,
        status: 'pending'
      },
      select: { id: true }
    });

    if (pending) {
      throw new AppError('您已举报过该评论，请勿重复提交', {
        statusCode: 409,
        code: 'REPORT_ALREADY_PENDING'
      });
    }

    return prisma.report.create({
      data: {
        reporterId: currentUser.id,
        targetType: 'comment',
        targetId: id,
        targetAuthorId: comment.authorId,
        reason: normalizedReason,
        description
      }
    });
  }

  async isContentAuthor(targetType: ContentType, targetId: string, userId: string) {
    if (targetType === 'post') {
      const post = await prisma.post.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return post?.authorId === userId;
    }

    if (targetType === 'blog') {
      const blog = await prisma.blog.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return blog?.authorId === userId;
    }

    if (targetType === 'project') {
      const project = await prisma.project.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return project?.authorId === userId;
    }

    if (targetType === 'snippet') {
      const snippet = await prisma.codeSnippet.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return snippet?.authorId === userId;
    }

    if (targetType === 'question') {
      const question = await prisma.question.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return question?.authorId === userId;
    }

    if (targetType === 'answer') {
      const answer = await prisma.answer.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return answer?.authorId === userId;
    }

    if (targetType === 'comment') {
      const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { authorId: true } });
      return comment?.authorId === userId;
    }

    return false;
  }

  async pin(id: string, currentUser: AuthUser, pinned = true) {
    const comment = await this.detail(id, currentUser);
    if (!comment) {
      return null;
    }

    try {
      return await prisma.comment.update({
        where: { id },
        data: {
          isPinned: pinned
        },
        include: commentInclude
      });
    } catch {
      return null;
    }
  }
}

export const commentService = new CommentService();
