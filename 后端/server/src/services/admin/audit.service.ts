import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { moderationService } from '../moderation.service';
import { incrementCommentCount } from '../interaction.service';

const authorSelect = { id: true, username: true, nickname: true, avatar: true };

class AuditService {
  async queue() {
    return prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approve(id: string) {
    try {
      return await prisma.report.update({
        where: { id },
        data: {
          status: 'resolved',
          handledAt: new Date(),
          handleResult: 'approved'
        }
      });
    } catch {
      return null;
    }
  }

  async reject(id: string, reason?: string) {
    try {
      return await prisma.report.update({
        where: { id },
        data: {
          status: 'rejected',
          handledAt: new Date(),
          handleResult: reason ?? 'rejected'
        }
      });
    } catch {
      return null;
    }
  }

  async batch(ids: string[], action: 'approve' | 'reject') {
    const result = await Promise.all(ids.map((id) => (action === 'approve' ? this.approve(id) : this.reject(id))));
    return {
      action,
      total: ids.length,
      success: result.filter(Boolean).length
    };
  }

  async history() {
    return prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async content(type: 'posts' | 'blogs' | 'projects' | 'questions') {
    if (type === 'posts') {
      return prisma.post.findMany({
        include: {
          author: { select: { id: true, username: true } },
          category: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    if (type === 'blogs') {
      return prisma.blog.findMany({
        include: {
          author: { select: { id: true, username: true } },
          category: { select: { id: true, name: true } },
          series: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    if (type === 'projects') {
      return prisma.project.findMany({
        include: {
          author: { select: { id: true, username: true } },
          category: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return prisma.question.findMany({
      include: {
        author: { select: { id: true, username: true } },
        answers: {
          include: {
            author: { select: { id: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- Content moderation pending queue ---

  async pendingQueue(type?: string) {
    const items: Array<{ contentType: string; id: string; title?: string; content: string; authorId: string; authorName?: string; createdAt: Date }> = [];

    if (!type || type === 'post') {
      const posts = await prisma.post.findMany({
        where: { status: 'pending' },
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'desc' }
      });
      for (const p of posts) {
        items.push({ contentType: 'post', id: p.id, title: p.title, content: p.content, authorId: p.authorId, authorName: p.author.nickname ?? p.author.username, createdAt: p.createdAt });
      }
    }

    if (!type || type === 'blog') {
      const blogs = await prisma.blog.findMany({
        where: { status: 'pending' },
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'desc' }
      });
      for (const b of blogs) {
        items.push({ contentType: 'blog', id: b.id, title: b.title, content: b.content, authorId: b.authorId, authorName: b.author.nickname ?? b.author.username, createdAt: b.createdAt });
      }
    }

    if (!type || type === 'question') {
      const questions = await prisma.question.findMany({
        where: { status: 'pending' },
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'desc' }
      });
      for (const q of questions) {
        items.push({ contentType: 'question', id: q.id, title: q.title, content: q.content, authorId: q.authorId, authorName: q.author.nickname ?? q.author.username, createdAt: q.createdAt });
      }
    }

    if (!type || type === 'comment') {
      const comments = await prisma.comment.findMany({
        where: { status: 'pending' },
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'desc' }
      });
      for (const c of comments) {
        items.push({ contentType: 'comment', id: c.id, content: c.content, authorId: c.authorId, authorName: c.author.nickname ?? c.author.username, createdAt: c.createdAt });
      }
    }

    if (!type || type === 'answer') {
      const answers = await prisma.answer.findMany({
        where: { status: 'pending' },
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: 'desc' }
      });
      for (const a of answers) {
        items.push({ contentType: 'answer', id: a.id, content: a.content, authorId: a.authorId, authorName: a.author.nickname ?? a.author.username, createdAt: a.createdAt });
      }
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items;
  }

  async approveContent(contentType: string, id: string, operatorId: string) {
    if (contentType === 'post') {
      await prisma.post.update({ where: { id }, data: { status: 'published' } });
    } else if (contentType === 'blog') {
      await prisma.blog.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } });
    } else if (contentType === 'question') {
      await prisma.question.update({ where: { id }, data: { status: 'open' } });
    } else if (contentType === 'comment') {
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (comment) {
        await prisma.$transaction(async (tx) => {
          await tx.comment.update({ where: { id }, data: { status: 'active' } });
          await incrementCommentCount(tx, comment.targetType, comment.targetId, 1);
          if (comment.parentId) {
            await tx.comment.update({
              where: { id: comment.parentId },
              data: { replyCount: { increment: 1 } }
            });
          }
        });
      }
    } else if (contentType === 'answer') {
      const answer = await prisma.answer.findUnique({ where: { id } });
      if (answer) {
        await prisma.$transaction(async (tx) => {
          await tx.answer.update({ where: { id }, data: { status: 'active' } });
          await tx.question.update({
            where: { id: answer.questionId },
            data: { answerCount: { increment: 1 } }
          });
          // Award points
          const user = await tx.user.findUnique({ where: { id: answer.authorId } });
          if (user) {
            const balance = user.points + 10;
            await tx.user.update({
              where: { id: answer.authorId },
              data: { points: balance }
            });
            await tx.pointsLog.create({
              data: {
                userId: answer.authorId,
                type: 'earn',
                action: 'answer',
                points: 10,
                balance,
                description: '提交回答奖励（审核通过后发放）'
              }
            });
          }
        });
      }
    }

    await moderationService.logAudit({
      contentType,
      contentId: id,
      operatorId,
      action: 'approve'
    });

    return { contentType, id, action: 'approved' };
  }

  async rejectContent(contentType: string, id: string, operatorId: string, reason?: string) {
    if (contentType === 'post') {
      await prisma.post.update({ where: { id }, data: { status: 'deleted' } });
    } else if (contentType === 'blog') {
      await prisma.blog.update({ where: { id }, data: { status: 'deleted' } });
    } else if (contentType === 'question') {
      await prisma.question.update({ where: { id }, data: { status: 'closed' } });
    } else if (contentType === 'comment') {
      await prisma.comment.update({ where: { id }, data: { status: 'deleted' } });
    } else if (contentType === 'answer') {
      await prisma.answer.update({ where: { id }, data: { status: 'deleted' } });
    }

    await moderationService.logAudit({
      contentType,
      contentId: id,
      operatorId,
      action: 'reject',
      reason
    });

    return { contentType, id, action: 'rejected', reason };
  }

  async batchPending(items: Array<{ contentType: string; id: string }>, action: 'approve' | 'reject', operatorId: string, reason?: string) {
    const results = await Promise.all(
      items.map((item) =>
        action === 'approve'
          ? this.approveContent(item.contentType, item.id, operatorId)
          : this.rejectContent(item.contentType, item.id, operatorId, reason)
      )
    );

    return {
      action,
      total: items.length,
      success: results.filter(Boolean).length
    };
  }
}

export const auditService = new AuditService();
