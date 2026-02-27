import { CategoryType, Prisma, ProjectStatus } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../config/database';
import { auditService } from '../../services/admin/audit.service';
import { AppError } from '../../utils/AppError';
import { toSlug } from '../../utils/helpers';
import { sendError, sendSuccess } from '../../utils/response';

const resolveType = (segment: string): 'posts' | 'blogs' | 'projects' | 'questions' => {
  if (segment === 'posts') return 'posts';
  if (segment === 'blogs') return 'blogs';
  if (segment === 'projects') return 'projects';
  if (segment === 'questions') return 'questions';
  throw new AppError('不支持的内容类型', { statusCode: 400, code: 'BAD_REQUEST' });
};

const toBoolean = (value: unknown, fallback = true) => {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
};

const isNotFoundError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

const parseContext = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  return {
    segment: parts[0] ?? '',
    action: parts[2] ?? ''
  };
};

const resolveCategoryType = (type: CategoryType) => type;

const buildCategorySlug = (name: string, slug?: string) => {
  const base = toSlug(slug || name) || 'category';
  return `${base}-${Date.now().toString(36).slice(-4)}`;
};

const PROJECT_STATUS_VALUES: ProjectStatus[] = ['developing', 'completed', 'maintained', 'deprecated'];

const parseProjectStatus = (value: unknown): ProjectStatus | null => {
  const status = String(value ?? '').trim();
  if (!status) {
    return null;
  }
  if (PROJECT_STATUS_VALUES.includes(status as ProjectStatus)) {
    return status as ProjectStatus;
  }
  return null;
};

export const adminContentController = {
  async list(req: Request, res: Response) {
    const segment = req.path.split('/').filter(Boolean)[0] ?? '';
    const type = resolveType(segment);
    return sendSuccess(res, await auditService.content(type), '获取内容列表成功');
  },

  async detail(req: Request, res: Response) {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, username: true, nickname: true, avatar: true } },
        category: { select: { id: true, name: true } }
      }
    });

    if (!post) {
      return sendError(res, 'NOT_FOUND', '帖子不存在', 404);
    }

    return sendSuccess(res, post, '获取帖子详情成功');
  },

  async action(req: Request, res: Response) {
    const { segment, action } = parseContext(req.path);

    try {
      if (segment === 'posts') {
        if (action === 'pin') {
          const data = await prisma.post.update({
            where: { id: req.params.id },
            data: { isPinned: toBoolean((req.body as { pinned?: boolean } | undefined)?.pinned) }
          });
          return sendSuccess(res, data, '更新置顶状态成功');
        }

        if (action === 'feature') {
          const data = await prisma.post.update({
            where: { id: req.params.id },
            data: { isFeatured: toBoolean((req.body as { featured?: boolean } | undefined)?.featured) }
          });
          return sendSuccess(res, data, '更新精华状态成功');
        }

        if (action === 'lock') {
          const data = await prisma.post.update({
            where: { id: req.params.id },
            data: { isLocked: toBoolean((req.body as { locked?: boolean } | undefined)?.locked) }
          });
          return sendSuccess(res, data, '更新锁定状态成功');
        }

        if (action === 'move') {
          const categoryId = (req.body as { categoryId?: string } | undefined)?.categoryId;
          const data = await prisma.post.update({
            where: { id: req.params.id },
            data: { categoryId: categoryId ? String(categoryId) : null }
          });
          return sendSuccess(res, data, '移动帖子成功');
        }
      }

      if (segment === 'blogs') {
        if (action === 'recommend') {
          const data = await prisma.blog.update({
            where: { id: req.params.id },
            data: { isRecommended: toBoolean((req.body as { recommended?: boolean } | undefined)?.recommended) }
          });
          return sendSuccess(res, data, '更新博客推荐状态成功');
        }

        if (action === 'banner') {
          const data = await prisma.blog.update({
            where: { id: req.params.id },
            data: { isBanner: toBoolean((req.body as { banner?: boolean } | undefined)?.banner) }
          });
          return sendSuccess(res, data, '更新博客轮播状态成功');
        }
      }

      if (segment === 'projects') {
        const payload = req.body as { status?: string };
        const nextStatus = parseProjectStatus(payload?.status);

        if (!nextStatus) {
          throw new AppError('项目状态不合法', { statusCode: 400, code: 'BAD_REQUEST' });
        }

        const data = await prisma.project.update({
          where: { id: req.params.id },
          data: {
            status: nextStatus
          }
        });

        return sendSuccess(res, data, '更新项目状态成功');
      }

      if (segment === 'questions') {
        if (action === 'close') {
          const data = await prisma.question.update({
            where: { id: req.params.id },
            data: { status: 'closed' }
          });
          return sendSuccess(res, data, '关闭问题成功');
        }

        if (action === 'duplicate') {
          const duplicateOfId = String(
            (req.body as { duplicateOfId?: string } | undefined)?.duplicateOfId ?? ''
          ).trim();
          const data = await prisma.question.update({
            where: { id: req.params.id },
            data: {
              status: 'duplicate',
              duplicateOfId: duplicateOfId || null
            }
          });
          return sendSuccess(res, data, '标记重复问题成功');
        }
      }

      if (segment === 'answers' && action === 'accept') {
        const result = await prisma.$transaction(async (tx) => {
          const answer = await tx.answer.findUnique({ where: { id: req.params.id } });
          if (!answer) {
            return null;
          }

          await tx.answer.updateMany({
            where: { questionId: answer.questionId },
            data: { isAccepted: false }
          });

          const accepted = await tx.answer.update({
            where: { id: req.params.id },
            data: { isAccepted: true }
          });

          await tx.question.update({
            where: { id: answer.questionId },
            data: {
              isSolved: true,
              status: 'closed',
              acceptedAnswerId: accepted.id
            }
          });

          return accepted;
        });

        if (!result) {
          return sendError(res, 'NOT_FOUND', '回答不存在', 404);
        }

        return sendSuccess(res, result, '设置最佳回答成功');
      }

      return sendSuccess(
        res,
        {
          id: req.params.id,
          action,
          payload: req.body
        },
        '操作成功'
      );
    } catch (error) {
      if (isNotFoundError(error)) {
        return sendError(res, 'NOT_FOUND', '内容不存在', 404);
      }
      throw error;
    }
  },

  async updateProjectStatus(req: Request, res: Response) {
    const status = parseProjectStatus((req.body as { status?: string } | undefined)?.status);
    if (!status) {
      throw new AppError('项目状态不合法', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    try {
      const data = await prisma.project.update({
        where: { id: req.params.id },
        data: { status }
      });
      return sendSuccess(res, data, '更新项目状态成功');
    } catch (error) {
      if (isNotFoundError(error)) {
        return sendError(res, 'NOT_FOUND', '项目不存在', 404);
      }
      throw error;
    }
  },

  async remove(req: Request, res: Response) {
    const segment = req.path.split('/').filter(Boolean)[0] ?? '';

    try {
      if (segment === 'posts') {
        const data = await prisma.post.update({
          where: { id: req.params.id },
          data: { status: 'deleted' }
        });
        return sendSuccess(res, data, '删除帖子成功');
      }

      if (segment === 'blogs') {
        const data = await prisma.blog.update({
          where: { id: req.params.id },
          data: { status: 'deleted' }
        });
        return sendSuccess(res, data, '删除博客成功');
      }

      if (segment === 'projects') {
        const data = await prisma.project.delete({ where: { id: req.params.id } });
        return sendSuccess(res, data, '删除项目成功');
      }

      if (segment === 'answers') {
        const result = await prisma.$transaction(async (tx) => {
          const answer = await tx.answer.findUnique({ where: { id: req.params.id } });
          if (!answer) {
            return null;
          }

          await tx.answer.delete({ where: { id: req.params.id } });

          const restCount = await tx.answer.count({ where: { questionId: answer.questionId } });
          await tx.question.update({
            where: { id: answer.questionId },
            data: {
              answerCount: restCount,
              acceptedAnswerId: answer.isAccepted ? null : undefined,
              isSolved: answer.isAccepted ? false : undefined,
              status: answer.isAccepted ? 'open' : undefined
            }
          });

          return { id: req.params.id };
        });

        if (!result) {
          return sendError(res, 'NOT_FOUND', '回答不存在', 404);
        }

        return sendSuccess(res, result, '删除回答成功');
      }

      if (segment === 'questions') {
        const result = await prisma.$transaction(async (tx) => {
          const exists = await tx.question.findUnique({ where: { id: req.params.id }, select: { id: true } });
          if (!exists) {
            return false;
          }

          await tx.answer.deleteMany({ where: { questionId: req.params.id } });
          await tx.question.delete({ where: { id: req.params.id } });
          return true;
        });

        if (!result) {
          return sendError(res, 'NOT_FOUND', '问题不存在', 404);
        }

        return sendSuccess(res, { id: req.params.id }, '删除问题成功');
      }

      return sendSuccess(res, { id: req.params.id }, '删除内容成功');
    } catch (error) {
      if (isNotFoundError(error)) {
        return sendError(res, 'NOT_FOUND', '内容不存在', 404);
      }
      throw error;
    }
  },

  async restore(req: Request, res: Response) {
    try {
      const data = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: 'published' }
      });
      return sendSuccess(res, data, '恢复内容成功');
    } catch (error) {
      if (isNotFoundError(error)) {
        return sendError(res, 'NOT_FOUND', '内容不存在', 404);
      }
      throw error;
    }
  },

  async bounties(_req: Request, res: Response) {
    const data = await prisma.question.findMany({
      where: { bounty: { gt: 0 } },
      include: {
        author: { select: { id: true, username: true } },
        answers: {
          select: { id: true, authorId: true, isAccepted: true },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [{ bounty: 'desc' }, { createdAt: 'desc' }]
    });

    return sendSuccess(res, data, '获取悬赏列表成功');
  },

  async settleBounty(req: Request, res: Response) {
    const answerId = String((req.body as { answerId?: string } | undefined)?.answerId ?? '').trim();

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({
        where: { id: req.params.id },
        include: {
          answers: {
            select: { id: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!question) {
        return null;
      }

      const winner = answerId
        ? question.answers.find((item) => item.id === answerId)?.id
        : (question.acceptedAnswerId ?? question.answers[0]?.id);

      if (winner) {
        await tx.answer.updateMany({
          where: { questionId: question.id },
          data: { isAccepted: false }
        });

        await tx.answer.update({
          where: { id: winner },
          data: { isAccepted: true }
        });
      }

      const updated = await tx.question.update({
        where: { id: question.id },
        data: {
          bounty: 0,
          bountyExpiresAt: null,
          isSolved: true,
          status: 'closed',
          acceptedAnswerId: winner ?? null
        }
      });

      return updated;
    });

    if (!result) {
      return sendError(res, 'NOT_FOUND', '悬赏问题不存在', 404);
    }

    return sendSuccess(res, result, '悬赏结算成功');
  },

  async blogSeries(_req: Request, res: Response) {
    const data = await prisma.series.findMany({
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { blogs: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const output = data.map((item) => ({
      ...item,
      articleCount: item._count.blogs
    }));

    return sendSuccess(res, output, '获取博客系列成功');
  },

  async updateBlogSeries(req: Request, res: Response) {
    try {
      const data = await prisma.series.update({
        where: { id: req.params.id },
        data: {
          name: req.body?.name ? String(req.body.name).trim() : undefined,
          description: req.body?.description !== undefined ? String(req.body.description ?? '') : undefined,
          coverImage: req.body?.coverImage !== undefined ? String(req.body.coverImage ?? '') : undefined
        }
      });

      return sendSuccess(res, data, '更新博客系列成功');
    } catch {
      return sendError(res, 'NOT_FOUND', '博客系列不存在', 404);
    }
  },

  async deleteBlogSeries(req: Request, res: Response) {
    const removed = await prisma.$transaction(async (tx) => {
      const exists = await tx.series.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!exists) {
        return false;
      }

      await tx.blog.updateMany({
        where: { seriesId: req.params.id },
        data: {
          seriesId: null,
          seriesOrder: null
        }
      });
      await tx.series.delete({ where: { id: req.params.id } });

      return true;
    });

    if (!removed) {
      return sendError(res, 'NOT_FOUND', '博客系列不存在', 404);
    }

    return sendSuccess(res, { id: req.params.id }, '删除博客系列成功');
  },

  async blogCategories(_req: Request, res: Response) {
    const data = await prisma.category.findMany({
      where: { type: 'blog' },
      include: {
        _count: { select: { blogs: true } }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    const output = data.map((item) => ({
      ...item,
      count: item._count.blogs
    }));

    return sendSuccess(res, output, '获取博客分类成功');
  },

  async createBlogCategory(req: Request, res: Response) {
    const name = String(req.body?.name ?? '').trim();
    if (!name) {
      return sendError(res, 'BAD_REQUEST', '分类名称不能为空', 400);
    }

    const data = await prisma.category.create({
      data: {
        name,
        slug: buildCategorySlug(name, req.body?.slug ? String(req.body.slug) : undefined),
        description: req.body?.description ? String(req.body.description) : undefined,
        icon: req.body?.icon ? String(req.body.icon) : undefined,
        parentId: req.body?.parentId ? String(req.body.parentId) : null,
        order: Number(req.body?.order ?? 0),
        type: resolveCategoryType('blog'),
        isActive: req.body?.isActive !== false
      }
    });

    return sendSuccess(res, data, '创建博客分类成功', 201);
  },

  async updateBlogCategory(req: Request, res: Response) {
    try {
      const data = await prisma.category.update({
        where: { id: req.params.id },
        data: {
          name: req.body?.name ? String(req.body.name).trim() : undefined,
          description: req.body?.description !== undefined ? String(req.body.description ?? '') : undefined,
          icon: req.body?.icon !== undefined ? String(req.body.icon ?? '') : undefined,
          order: req.body?.order !== undefined ? Number(req.body.order) : undefined,
          isActive: req.body?.isActive !== undefined ? req.body.isActive !== false : undefined
        }
      });

      return sendSuccess(res, data, '更新博客分类成功');
    } catch {
      return sendError(res, 'NOT_FOUND', '博客分类不存在', 404);
    }
  },

  async deleteBlogCategory(req: Request, res: Response) {
    const removed = await prisma.$transaction(async (tx) => {
      const exists = await tx.category.findFirst({
        where: {
          id: req.params.id,
          type: 'blog'
        },
        select: { id: true }
      });

      if (!exists) {
        return false;
      }

      await tx.blog.updateMany({
        where: { categoryId: req.params.id },
        data: { categoryId: null }
      });

      await tx.category.delete({ where: { id: req.params.id } });
      return true;
    });

    if (!removed) {
      return sendError(res, 'NOT_FOUND', '博客分类不存在', 404);
    }

    return sendSuccess(res, { id: req.params.id }, '删除博客分类成功');
  },

  async projectCategories(_req: Request, res: Response) {
    const data = await prisma.category.findMany({
      where: { type: 'project' },
      include: {
        _count: { select: { projects: true } }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    const output = data.map((item) => ({
      ...item,
      count: item._count.projects
    }));

    return sendSuccess(res, output, '获取项目分类成功');
  },

  async createProjectCategory(req: Request, res: Response) {
    const name = String(req.body?.name ?? '').trim();
    if (!name) {
      return sendError(res, 'BAD_REQUEST', '分类名称不能为空', 400);
    }

    const data = await prisma.category.create({
      data: {
        name,
        slug: buildCategorySlug(name, req.body?.slug ? String(req.body.slug) : undefined),
        description: req.body?.description ? String(req.body.description) : undefined,
        icon: req.body?.icon ? String(req.body.icon) : undefined,
        parentId: req.body?.parentId ? String(req.body.parentId) : null,
        order: Number(req.body?.order ?? 0),
        type: resolveCategoryType('project'),
        isActive: req.body?.isActive !== false
      }
    });

    return sendSuccess(res, data, '创建项目分类成功', 201);
  },

  async updateProjectCategory(req: Request, res: Response) {
    try {
      const data = await prisma.category.update({
        where: { id: req.params.id },
        data: {
          name: req.body?.name ? String(req.body.name).trim() : undefined,
          description: req.body?.description !== undefined ? String(req.body.description ?? '') : undefined,
          icon: req.body?.icon !== undefined ? String(req.body.icon ?? '') : undefined,
          order: req.body?.order !== undefined ? Number(req.body.order) : undefined,
          isActive: req.body?.isActive !== undefined ? req.body.isActive !== false : undefined
        }
      });

      return sendSuccess(res, data, '更新项目分类成功');
    } catch {
      return sendError(res, 'NOT_FOUND', '项目分类不存在', 404);
    }
  },

  async deleteProjectCategory(req: Request, res: Response) {
    const removed = await prisma.$transaction(async (tx) => {
      const exists = await tx.category.findFirst({
        where: {
          id: req.params.id,
          type: 'project'
        },
        select: { id: true }
      });

      if (!exists) {
        return false;
      }

      await tx.project.updateMany({
        where: { categoryId: req.params.id },
        data: { categoryId: null }
      });

      await tx.category.delete({ where: { id: req.params.id } });
      return true;
    });

    if (!removed) {
      return sendError(res, 'NOT_FOUND', '项目分类不存在', 404);
    }

    return sendSuccess(res, { id: req.params.id }, '删除项目分类成功');
  }
};
