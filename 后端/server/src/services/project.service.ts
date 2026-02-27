import { Prisma, ProjectStatus } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { buildPagination, markdownToHtml } from '../utils/helpers';
import { toggleFavorite, toggleLike } from './interaction.service';
import { sensitiveWordService } from './sensitiveWord.service';

const projectInclude = {
  author: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true
    }
  },
  category: true
} satisfies Prisma.ProjectInclude;

class ProjectService {
  async list(query: { page?: string | number; limit?: string | number; status?: string; authorId?: string }) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const where: Prisma.ProjectWhereInput = {};

    if (query.status && ['developing', 'completed', 'maintained', 'deprecated'].includes(query.status)) {
      where.status = query.status as ProjectStatus;
    }
    if (query.authorId) {
      where.authorId = query.authorId;
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.project.count({ where })
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

  async detail(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: projectInclude
    });
  }

  async findById(id: string) {
    return prisma.project.findUnique({ where: { id } });
  }

  async createProject(payload: Record<string, unknown>, authorId: string) {
    const content = payload.content ? String(payload.content) : '';
    const name = String(payload.name ?? '');
    const description = payload.description ? String(payload.description) : '';
    const status = ['developing', 'completed', 'maintained', 'deprecated'].includes(String(payload.status ?? ''))
      ? (String(payload.status) as ProjectStatus)
      : 'developing';

    const sensitiveResult = sensitiveWordService.checkFields(name, description, content);
    if (sensitiveResult.hit) {
      throw new AppError(`内容包含敏感词：${sensitiveResult.word ?? ''}`, {
        statusCode: 403,
        code: 'CONTENT_BLOCKED',
        details: { reason: `内容包含敏感词：${sensitiveResult.word ?? ''}` }
      });
    }

    const categoryId =
      typeof payload.categoryId === 'string'
        ? payload.categoryId
        : typeof payload.category === 'string'
          ? payload.category
          : undefined;

    return prisma.project.create({
      data: {
        name,
        description: description || undefined,
        content,
        contentHtml: content ? markdownToHtml(content) : undefined,
        coverImage: payload.coverImage ? String(payload.coverImage) : undefined,
        screenshots: Array.isArray(payload.screenshots) ? payload.screenshots.map((item) => String(item)) : [],
        techStack: Array.isArray(payload.techStack) ? payload.techStack.map((item) => String(item)) : [],
        demoUrl: payload.demoUrl ? String(payload.demoUrl) : undefined,
        sourceUrl: payload.sourceUrl ? String(payload.sourceUrl) : undefined,
        status,
        author: {
          connect: { id: authorId }
        },
        category: categoryId
          ? {
              connect: {
                id: categoryId
              }
            }
          : undefined
      },
      include: projectInclude
    });
  }

  async updateProject(id: string, payload: Record<string, unknown>) {
    const current = await prisma.project.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        content: true
      }
    });

    if (!current) {
      return null;
    }

    const data: Prisma.ProjectUpdateInput = {};

    const nextName = payload.name !== undefined ? String(payload.name) : current.name;
    const nextDescription =
      payload.description !== undefined ? String(payload.description ?? '') : String(current.description ?? '');
    const nextContent = payload.content !== undefined ? String(payload.content ?? '') : current.content;

    const shouldCheckSensitive = payload.name !== undefined || payload.description !== undefined || payload.content !== undefined;
    if (shouldCheckSensitive) {
      const sensitiveResult = sensitiveWordService.checkFields(nextName, nextDescription, nextContent);
      if (sensitiveResult.hit) {
        throw new AppError(`内容包含敏感词：${sensitiveResult.word ?? ''}`, {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: `内容包含敏感词：${sensitiveResult.word ?? ''}` }
        });
      }
    }

    if (payload.name !== undefined) {
      data.name = String(payload.name);
    }

    if (payload.description !== undefined) {
      data.description = payload.description ? String(payload.description) : null;
    }

    if (payload.content !== undefined) {
      const content = String(payload.content ?? '');
      data.content = content;
      data.contentHtml = content ? markdownToHtml(content) : null;
    }

    if (payload.coverImage !== undefined) {
      data.coverImage = payload.coverImage ? String(payload.coverImage) : null;
    }

    if (payload.screenshots !== undefined) {
      data.screenshots = Array.isArray(payload.screenshots) ? payload.screenshots.map((item) => String(item)) : [];
    }

    if (payload.techStack !== undefined) {
      data.techStack = Array.isArray(payload.techStack) ? payload.techStack.map((item) => String(item)) : [];
    }

    if (payload.demoUrl !== undefined) {
      data.demoUrl = payload.demoUrl ? String(payload.demoUrl) : null;
    }

    if (payload.sourceUrl !== undefined) {
      data.sourceUrl = payload.sourceUrl ? String(payload.sourceUrl) : null;
    }

    if (payload.status !== undefined) {
      const status = String(payload.status);
      if (['developing', 'completed', 'maintained', 'deprecated'].includes(status)) {
        data.status = status as ProjectStatus;
      }
    }

    const categoryId =
      typeof payload.categoryId === 'string'
        ? payload.categoryId
        : typeof payload.category === 'string'
          ? payload.category
          : undefined;
    if (categoryId !== undefined) {
      data.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
    }

    try {
      return await prisma.project.update({
        where: { id },
        data,
        include: projectInclude
      });
    } catch {
      return null;
    }
  }

  async remove(id: string) {
    const result = await prisma.project.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async like(id: string, userId: string) {
    const liked = await toggleLike(userId, 'project', id);
    const project = await this.detail(id);
    return {
      ...liked,
      project
    };
  }

  async favorite(id: string, userId: string) {
    const favorited = await toggleFavorite(userId, 'project', id);
    const project = await this.detail(id);
    return {
      ...favorited,
      project
    };
  }

  async rateProject(id: string, userId: string, score: number) {
    try {
      return await prisma.$transaction(async (tx) => {
        const project = await tx.project.findUnique({ where: { id } });
        if (!project) {
          return null;
        }

        const existingRating = await tx.projectRating.findUnique({
          where: {
            projectId_userId: {
              projectId: id,
              userId
            }
          }
        });

        let ratingCount = project.ratingCount;
        let totalScore = project.ratingAvg * project.ratingCount;

        if (existingRating) {
          totalScore = totalScore - existingRating.score + score;
          await tx.projectRating.update({
            where: {
              projectId_userId: {
                projectId: id,
                userId
              }
            },
            data: {
              score
            }
          });
        } else {
          totalScore += score;
          ratingCount += 1;
          await tx.projectRating.create({
            data: {
              projectId: id,
              userId,
              score
            }
          });
        }

        const ratingAvg = ratingCount > 0 ? Number((totalScore / ratingCount).toFixed(2)) : 0;

        return tx.project.update({
          where: { id },
          data: {
            ratingCount,
            ratingAvg
          },
          include: projectInclude
        });
      });
    } catch {
      return null;
    }
  }

  async listRatings(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return [];
    }

    return [
      {
        projectId: id,
        ratingAvg: project.ratingAvg,
        ratingCount: project.ratingCount
      }
    ];
  }

  async related(id: string) {
    const current = await prisma.project.findUnique({ where: { id }, select: { categoryId: true } });
    const where: Prisma.ProjectWhereInput = { id: { not: id } };
    if (current?.categoryId) {
      where.categoryId = current.categoryId;
    }

    return prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
      take: 6
    });
  }
}

export const projectService = new ProjectService();
