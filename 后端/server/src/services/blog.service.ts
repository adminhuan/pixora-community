import { BlogStatus, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { buildPagination, markdownToHtml, toSlug } from '../utils/helpers';
import { logger } from '../utils/logger';
import { AuthUser } from '../types/common';
import { toggleFavorite, toggleLike } from './interaction.service';
import { moderationService } from './moderation.service';

const blogInclude = {
  author: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true
    }
  },
  category: true,
  series: true,
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.BlogInclude;

const normalizeTagNames = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  return Array.from(new Set(tags.map((item) => String(item).trim()).filter(Boolean)));
};

const buildBlogTagCreateInput = (tags: string[]): Prisma.BlogTagCreateWithoutBlogInput[] => {
  return tags.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { slug: toSlug(name) },
        create: {
          name,
          slug: toSlug(name)
        }
      }
    }
  }));
};

const canReadBlog = (blog: { status: BlogStatus; authorId: string }, currentUser?: AuthUser): boolean => {
  if (blog.status === 'published') {
    return true;
  }

  if (!currentUser) {
    return false;
  }

  return currentUser.role === 'admin' || currentUser.id === blog.authorId;
};

class BlogService {
  private readingTime(content: string): number {
    const words = content.length;
    return Math.max(Math.ceil(words / 450), 1);
  }

  async list(
    query: { page?: string | number; limit?: string | number; status?: string; authorId?: string },
    currentUser?: AuthUser
  ) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const where: Prisma.BlogWhereInput = {};

    const authorId = String(query.authorId ?? '').trim();
    if (authorId) {
      where.authorId = authorId;
    }

    const requestedStatus = query.status && ['draft', 'published', 'deleted', 'pending'].includes(query.status)
      ? (query.status as BlogStatus)
      : undefined;

    const canViewAllStatuses =
      Boolean(currentUser) &&
      (currentUser?.role === 'admin' || (authorId && currentUser?.id === authorId));

    if (canViewAllStatuses) {
      where.status = requestedStatus ?? 'published';
    } else {
      where.status = 'published';
    }

    const [data, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: blogInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blog.count({ where })
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
    const blog = await prisma.blog.findUnique({ where: { id }, include: blogInclude });

    if (!blog) {
      return null;
    }

    return canReadBlog(blog, currentUser) ? blog : null;
  }

  async findById(id: string) {
    return prisma.blog.findUnique({ where: { id } });
  }

  async createBlog(payload: Record<string, unknown>, authorId: string, status: BlogStatus = 'published') {
    const content = String(payload.content ?? '');
    const title = String(payload.title ?? '');
    const tagNames = normalizeTagNames(payload.tags);

    let finalStatus = status;

    // Only moderate when publishing
    if (finalStatus === 'published') {
      const modResult = await moderationService.moderate('blog', title, content);
      if (modResult.blocked) {
        throw new AppError(modResult.blockReason ?? '内容审核未通过', {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: modResult.blockReason }
        });
      }
      finalStatus = modResult.status as BlogStatus;
    }

    const data: Prisma.BlogCreateInput = {
      title,
      content,
      contentHtml: markdownToHtml(content),
      summary: payload.summary ? String(payload.summary) : undefined,
      coverImage: payload.coverImage ? String(payload.coverImage) : undefined,
      status: finalStatus,
      readingTime: this.readingTime(content),
      publishedAt: finalStatus === 'published' ? new Date() : null,
      author: {
        connect: { id: authorId }
      }
    };

    const categoryId =
      typeof payload.categoryId === 'string'
        ? payload.categoryId
        : typeof payload.category === 'string'
          ? payload.category
          : undefined;
    if (categoryId) {
      data.category = { connect: { id: categoryId } };
    }

    if (typeof payload.seriesId === 'string') {
      data.series = { connect: { id: payload.seriesId } };
    } else if (typeof payload.series === 'string') {
      data.series = { connect: { id: payload.series } };
    }

    if (payload.seriesOrder !== undefined) {
      data.seriesOrder = Number(payload.seriesOrder);
    }

    if (tagNames.length > 0) {
      data.tags = {
        create: buildBlogTagCreateInput(tagNames)
      };
    }

    return prisma.blog.create({ data, include: blogInclude });
  }

  async updateBlog(id: string, payload: Record<string, unknown>) {
    const current = await prisma.blog.findUnique({
      where: { id },
      select: {
        title: true,
        content: true,
        status: true,
        publishedAt: true
      }
    });

    if (!current) {
      return null;
    }

    const data: Prisma.BlogUpdateInput = {};
    const nextTitle = payload.title !== undefined ? String(payload.title) : current.title;
    const nextContent = payload.content !== undefined ? String(payload.content) : current.content;
    const requestedStatus =
      payload.status !== undefined && ['draft', 'published', 'deleted', 'pending'].includes(String(payload.status))
        ? (String(payload.status) as BlogStatus)
        : undefined;
    let finalStatus: BlogStatus = requestedStatus ?? current.status;

    if (payload.title !== undefined) {
      data.title = String(payload.title);
    }

    if (payload.content !== undefined) {
      const content = String(payload.content);
      data.content = content;
      data.contentHtml = markdownToHtml(content);
      data.readingTime = this.readingTime(content);
    }

    if (payload.summary !== undefined) {
      data.summary = payload.summary ? String(payload.summary) : null;
    }

    if (payload.coverImage !== undefined) {
      data.coverImage = payload.coverImage ? String(payload.coverImage) : null;
    }

    if (payload.status !== undefined && requestedStatus) {
      data.status = requestedStatus;
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

    const seriesId =
      typeof payload.seriesId === 'string'
        ? payload.seriesId
        : typeof payload.series === 'string'
          ? payload.series
          : undefined;
    if (seriesId !== undefined) {
      data.series = seriesId ? { connect: { id: seriesId } } : { disconnect: true };
    }

    if (payload.seriesOrder !== undefined) {
      data.seriesOrder = Number(payload.seriesOrder);
    }

    if (payload.tags !== undefined) {
      const tags = normalizeTagNames(payload.tags);
      data.tags = {
        deleteMany: {},
        create: buildBlogTagCreateInput(tags)
      };
    }

    const shouldModerate =
      finalStatus === 'published' &&
      (payload.title !== undefined || payload.content !== undefined || payload.status !== undefined);

    if (shouldModerate) {
      const modResult = await moderationService.moderate('blog', nextTitle, nextContent);
      if (modResult.blocked) {
        throw new AppError(modResult.blockReason ?? '内容审核未通过', {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: modResult.blockReason }
        });
      }

      finalStatus = modResult.status as BlogStatus;
      data.status = finalStatus;
    }

    data.publishedAt = finalStatus === 'published' ? current.publishedAt ?? new Date() : null;

    try {
      return await prisma.blog.update({
        where: { id },
        data,
        include: blogInclude
      });
    } catch (error) {
      logger.error('更新博客失败', {
        id,
        error: (error as Error).message
      });
      return null;
    }
  }

  async remove(id: string) {
    const result = await prisma.blog.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async like(id: string, userId: string) {
    const liked = await toggleLike(userId, 'blog', id);
    const blog = await this.detail(id);
    return {
      ...liked,
      blog
    };
  }

  async favorite(id: string, userId: string) {
    const favorited = await toggleFavorite(userId, 'blog', id);
    const blog = await this.detail(id);
    return {
      ...favorited,
      blog
    };
  }

  async listDrafts(authorId?: string) {
    return prisma.blog.findMany({
      where: {
        status: 'draft',
        authorId
      },
      include: blogInclude,
      orderBy: { updatedAt: 'desc' }
    });
  }

  async publishDraft(id: string) {
    try {
      return await prisma.blog.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: new Date()
        },
        include: blogInclude
      });
    } catch (error) {
      logger.error('发布博客草稿失败', {
        id,
        error: (error as Error).message
      });
      return null;
    }
  }

  async listSeries() {
    return prisma.series.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createSeries(payload: Record<string, unknown>, authorId: string) {
    return prisma.series.create({
      data: {
        name: String(payload.name ?? ''),
        description: payload.description ? String(payload.description) : undefined,
        coverImage: payload.coverImage ? String(payload.coverImage) : undefined,
        author: { connect: { id: authorId } }
      }
    });
  }

  async updateSeries(id: string, payload: Record<string, unknown>) {
    try {
      return await prisma.series.update({
        where: { id },
        data: {
          name: payload.name ? String(payload.name) : undefined,
          description: payload.description !== undefined ? String(payload.description ?? '') : undefined,
          coverImage: payload.coverImage !== undefined ? String(payload.coverImage ?? '') : undefined
        }
      });
    } catch (error) {
      logger.error('更新博客系列失败', {
        id,
        error: (error as Error).message
      });
      return null;
    }
  }

  async deleteSeries(id: string) {
    const result = await prisma.series.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async detailSeries(id: string) {
    return prisma.series.findUnique({
      where: { id },
      include: {
        blogs: {
          orderBy: {
            seriesOrder: 'asc'
          }
        }
      }
    });
  }

  async followSeries(id: string) {
    try {
      return await prisma.series.update({
        where: { id },
        data: {
          followersCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      logger.error('关注博客系列失败', {
        id,
        error: (error as Error).message
      });
      return null;
    }
  }

  async reorderSeries(seriesId: string, order: Array<{ blogId: string; seriesOrder: number }>) {
    if (order.length === 0) {
      return {
        seriesId,
        updated: 0
      };
    }

    const blogIds = order.map((item) => item.blogId);
    const uniqueIds = new Set(blogIds);
    if (uniqueIds.size !== blogIds.length) {
      throw new AppError('排序数据包含重复博客', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const hasInvalidOrder = order.some((item) => !Number.isInteger(item.seriesOrder) || item.seriesOrder < 1);
    if (hasInvalidOrder) {
      throw new AppError('排序值必须是正整数', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const blogs = await prisma.blog.findMany({
      where: {
        id: { in: blogIds },
        seriesId
      },
      select: { id: true }
    });

    if (blogs.length !== blogIds.length) {
      throw new AppError('部分博客不属于该系列', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    await prisma.$transaction(
      order.map((item) =>
        prisma.blog.update({
          where: { id: item.blogId },
          data: {
            seriesOrder: item.seriesOrder
          }
        })
      )
    );

    return {
      seriesId,
      updated: order.length
    };
  }
}

export const blogService = new BlogService();
