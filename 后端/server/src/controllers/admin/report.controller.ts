import { Request, Response } from 'express';
import prisma from '../../config/database';
import { config } from '../../config';
import { sendError, sendSuccess } from '../../utils/response';

const statusLabelMap: Record<string, string> = {
  pending: '待处理',
  resolved: '已处理',
  rejected: '已驳回'
};

const reasonLabelMap: Record<string, string> = {
  spam: '垃圾信息',
  abuse: '辱骂攻击',
  inappropriate: '不当内容',
  copyright: '侵权内容',
  other: '其他'
};

const buildFrontendBaseUrl = () => {
  const callback = String(config.oauth.frontendCallbackUrl ?? '').trim();
  if (!callback) {
    return '';
  }

  try {
    const url = new URL(callback);
    return `${url.origin}${url.pathname.replace(/\/auth\/callback.*$/, '')}`.replace(/\/$/, '');
  } catch {
    return callback.replace(/\/auth\/callback.*$/, '').replace(/\/$/, '');
  }
};

const frontendBaseUrl = buildFrontendBaseUrl();

const buildSourcePath = (type: string, id: string, extra?: { questionId?: string }) => {
  if (!id) {
    return '';
  }

  if (type === 'post') {
    return `/forum/${id}`;
  }
  if (type === 'blog') {
    return `/blog/${id}`;
  }
  if (type === 'question') {
    return `/qa/${id}`;
  }
  if (type === 'answer') {
    const questionId = String(extra?.questionId ?? '').trim();
    return questionId ? `/qa/${questionId}` : '';
  }
  if (type === 'project') {
    return `/projects/${id}`;
  }
  if (type === 'snippet') {
    return `/code/${id}`;
  }

  return '';
};

const buildSourceUrl = (path: string) => {
  if (!path || !frontendBaseUrl) {
    return '';
  }
  return `${frontendBaseUrl}${path}`;
};

export const adminReportController = {
  async comments(req: Request, res: Response) {
    const { targetType, targetId } = req.query as { targetType?: string; targetId?: string };
    const where: Record<string, unknown> = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, nickname: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return sendSuccess(res, comments, '获取评论列表成功');
  },

  async deleteComment(req: Request, res: Response) {
    await prisma.comment.updateMany({
      where: { id: req.params.id },
      data: {
        status: 'deleted'
      }
    });
    return sendSuccess(res, { id: req.params.id }, '删除评论成功');
  },

  async batchDeleteComments(req: Request, res: Response) {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.map((item: unknown) => String(item ?? '').trim()).filter(Boolean)
      : [];

    if (!ids.length) {
      return sendError(res, 'BAD_REQUEST', '评论ID列表不能为空', 400);
    }

    const result = await prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'deleted'
      }
    });

    return sendSuccess(
      res,
      {
        ids,
        updatedCount: result.count
      },
      '批量删除评论成功'
    );
  },

  async reports(_req: Request, res: Response) {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        },
        targetAuthor: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        },
        handledBy: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const commentIds = reports.filter((item) => item.targetType === 'comment').map((item) => item.targetId);
    const comments = commentIds.length
      ? await prisma.comment.findMany({
          where: { id: { in: commentIds } },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                nickname: true
              }
            }
          }
        })
      : [];

    const commentMap = new Map(comments.map((item) => [item.id, item]));

    const sourceIds = {
      post: new Set<string>(),
      blog: new Set<string>(),
      question: new Set<string>(),
      answer: new Set<string>(),
      project: new Set<string>(),
      snippet: new Set<string>()
    };

    comments.forEach((item) => {
      const targetType = String(item.targetType ?? '');
      if (targetType === 'post') sourceIds.post.add(item.targetId);
      if (targetType === 'blog') sourceIds.blog.add(item.targetId);
      if (targetType === 'question') sourceIds.question.add(item.targetId);
      if (targetType === 'answer') sourceIds.answer.add(item.targetId);
      if (targetType === 'project') sourceIds.project.add(item.targetId);
      if (targetType === 'snippet') sourceIds.snippet.add(item.targetId);
    });

    const [posts, blogs, questions, answers, projects, snippets] = await Promise.all([
      sourceIds.post.size
        ? prisma.post.findMany({
            where: { id: { in: Array.from(sourceIds.post) } },
            select: { id: true, title: true, content: true, contentHtml: true }
          })
        : Promise.resolve([]),
      sourceIds.blog.size
        ? prisma.blog.findMany({
            where: { id: { in: Array.from(sourceIds.blog) } },
            select: { id: true, title: true, content: true, contentHtml: true }
          })
        : Promise.resolve([]),
      sourceIds.question.size
        ? prisma.question.findMany({
            where: { id: { in: Array.from(sourceIds.question) } },
            select: { id: true, title: true, content: true, contentHtml: true }
          })
        : Promise.resolve([]),
      sourceIds.answer.size
        ? prisma.answer.findMany({
            where: { id: { in: Array.from(sourceIds.answer) } },
            select: { id: true, content: true, contentHtml: true, questionId: true }
          })
        : Promise.resolve([]),
      sourceIds.project.size
        ? prisma.project.findMany({
            where: { id: { in: Array.from(sourceIds.project) } },
            select: { id: true, name: true, content: true, description: true }
          })
        : Promise.resolve([]),
      sourceIds.snippet.size
        ? prisma.codeSnippet.findMany({
            where: { id: { in: Array.from(sourceIds.snippet) } },
            select: { id: true, title: true, description: true }
          })
        : Promise.resolve([])
    ]);

    const sourceMap = new Map<string, Record<string, unknown>>();

    posts.forEach((item) => {
      const path = buildSourcePath('post', item.id);
      sourceMap.set(`post:${item.id}`, {
        type: 'post',
        id: item.id,
        title: item.title,
        content: item.content || item.contentHtml || '',
        path,
        url: buildSourceUrl(path)
      });
    });

    blogs.forEach((item) => {
      const path = buildSourcePath('blog', item.id);
      sourceMap.set(`blog:${item.id}`, {
        type: 'blog',
        id: item.id,
        title: item.title,
        content: item.content || item.contentHtml || '',
        path,
        url: buildSourceUrl(path)
      });
    });

    questions.forEach((item) => {
      const path = buildSourcePath('question', item.id);
      sourceMap.set(`question:${item.id}`, {
        type: 'question',
        id: item.id,
        title: item.title,
        content: item.content || item.contentHtml || '',
        path,
        url: buildSourceUrl(path)
      });
    });

    answers.forEach((item) => {
      const path = buildSourcePath('answer', item.id, { questionId: item.questionId });
      sourceMap.set(`answer:${item.id}`, {
        type: 'answer',
        id: item.id,
        title: `回答 #${item.id.slice(-6)}`,
        content: item.content || item.contentHtml || '',
        path,
        url: buildSourceUrl(path)
      });
    });

    projects.forEach((item) => {
      const path = buildSourcePath('project', item.id);
      sourceMap.set(`project:${item.id}`, {
        type: 'project',
        id: item.id,
        title: item.name,
        content: item.content || item.description || '',
        path,
        url: buildSourceUrl(path)
      });
    });

    snippets.forEach((item) => {
      const path = buildSourcePath('snippet', item.id);
      sourceMap.set(`snippet:${item.id}`, {
        type: 'snippet',
        id: item.id,
        title: item.title,
        content: item.description || '',
        path,
        url: buildSourceUrl(path)
      });
    });

    const data = reports.map((item) => {
      const reason = String(item.reason ?? 'other');
      const status = String(item.status ?? 'pending');
      const comment = item.targetType === 'comment' ? commentMap.get(item.targetId) : undefined;
      const source = comment ? sourceMap.get(`${String(comment.targetType)}:${comment.targetId}`) : undefined;
      const reporterName =
        item.reporter?.nickname?.trim() || item.reporter?.username?.trim() || String(item.reporterId ?? '-');
      const reportedUserName =
        item.targetAuthor?.nickname?.trim() ||
        item.targetAuthor?.username?.trim() ||
        comment?.author?.nickname?.trim() ||
        comment?.author?.username?.trim() ||
        String(item.targetAuthorId ?? '-');
      const handledByName =
        item.handledBy?.nickname?.trim() || item.handledBy?.username?.trim() || String(item.handledById ?? '');
      const targetSummary = String(comment?.content || source?.title || `${item.targetType}#${item.targetId}`).slice(
        0,
        90
      );

      return {
        id: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        targetSummary,
        reason,
        reasonLabel: reasonLabelMap[reason] ?? reason,
        description: item.description || '',
        status,
        statusLabel: statusLabelMap[status] ?? status,
        handleResult: item.handleResult || '',
        createdAt: item.createdAt,
        handledAt: item.handledAt,
        reporterId: item.reporterId,
        targetAuthorId: item.targetAuthorId,
        reporterName,
        reportedUserName,
        handledByName,
        reporter: item.reporter,
        targetAuthor: item.targetAuthor,
        handledBy: item.handledBy,
        comment: comment
          ? {
              id: comment.id,
              content: comment.content,
              contentHtml: comment.contentHtml,
              status: comment.status,
              targetType: comment.targetType,
              targetId: comment.targetId,
              author: comment.author,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt
            }
          : null,
        source: source ?? null
      };
    });

    return sendSuccess(res, data, '获取举报列表成功');
  },

  async handleReport(req: Request, res: Response) {
    const action = String(req.body.action ?? '').trim();
    const customStatus = String(req.body.status ?? '').trim();
    const customResult = String(req.body.result ?? '').trim();

    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) {
      return sendSuccess(res, null, '举报不存在');
    }

    const status = ['pending', 'resolved', 'rejected'].includes(customStatus)
      ? (customStatus as 'pending' | 'resolved' | 'rejected')
      : action === 'reject'
        ? 'rejected'
        : 'resolved';

    const resultText =
      customResult ||
      (action === 'delete'
        ? '已删除被举报内容'
        : action === 'warn'
          ? '已警告被举报用户'
          : action === 'mute'
            ? '已禁言被举报用户'
            : action === 'ban'
              ? '已封禁被举报用户'
              : action === 'reject'
                ? '已驳回举报'
                : '已处理');

    const updated = await prisma.$transaction(async (tx) => {
      if (action === 'delete' && report.targetType === 'comment') {
        await tx.comment.updateMany({
          where: { id: report.targetId },
          data: { status: 'deleted' }
        });
      }

      let targetAuthorId = report.targetAuthorId;

      if (!targetAuthorId && report.targetType === 'comment') {
        const targetComment = await tx.comment.findUnique({
          where: { id: report.targetId },
          select: { authorId: true }
        });
        targetAuthorId = targetComment?.authorId ?? null;
      }

      if (targetAuthorId && (action === 'mute' || action === 'ban')) {
        const durationDays = action === 'mute' ? 7 : 30;
        const until = new Date(Date.now() + durationDays * 24 * 3600 * 1000);

        await tx.user.updateMany({
          where: { id: targetAuthorId },
          data:
            action === 'mute'
              ? {
                  status: 'muted',
                  mutedUntil: until
                }
              : {
                  status: 'banned',
                  bannedUntil: until
                }
        });
      }

      return tx.report.update({
        where: { id: req.params.id },
        data: {
          status,
          handleResult: resultText,
          targetAuthorId: targetAuthorId ?? report.targetAuthorId,
          handledById: req.user?.id,
          handledAt: new Date()
        }
      });
    });

    return sendSuccess(res, updated, '处理举报成功');
  },

  async stats(_req: Request, res: Response) {
    const [total, pending, resolved, rejected] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.report.count({ where: { status: 'resolved' } }),
      prisma.report.count({ where: { status: 'rejected' } })
    ]);

    return sendSuccess(
      res,
      {
        total,
        pending,
        resolved,
        rejected
      },
      '获取举报统计成功'
    );
  }
};
