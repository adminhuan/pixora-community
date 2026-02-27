import { PostStatus, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AuthUser } from '../types/common';
import { markdownToHtml, toSlug, buildPagination } from '../utils/helpers';
import { toggleFavorite, toggleLike } from './interaction.service';
import { moderationService } from './moderation.service';
import { AppError } from '../utils/AppError';

const postInclude = {
  author: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true
    }
  },
  category: true,
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.PostInclude;

const normalizeTagNames = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  return Array.from(new Set(tags.map((item) => String(item).trim()).filter(Boolean)));
};

const buildTagCreateInput = (tags: string[]): Prisma.PostTagCreateWithoutPostInput[] => {
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

const resolvePostStatus = (value: unknown): PostStatus | undefined => {
  const status = String(value ?? '').trim();
  if (status === 'draft' || status === 'published' || status === 'deleted' || status === 'pending') {
    return status;
  }
  return undefined;
};

const canReadPost = (post: { status: PostStatus; authorId: string }, currentUser?: AuthUser): boolean => {
  if (post.status === 'published') {
    return true;
  }

  if (!currentUser) {
    return false;
  }

  // pending/draft posts visible to author and admin
  return currentUser.role === 'admin' || currentUser.id === post.authorId;
};

class PostService {
  async list(
    query: {
      page?: string | number;
      limit?: string | number;
      status?: string;
      authorId?: string;
      author?: string;
      category?: string;
      tag?: string;
      keyword?: string;
      sort?: string;
    },
    currentUser?: AuthUser
  ) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const where: Prisma.PostWhereInput = {};

    const authorId = String(query.authorId ?? query.author ?? '').trim();
    if (authorId) {
      where.authorId = authorId;
    }

    const requestedStatus = resolvePostStatus(query.status);
    const canViewAllStatuses =
      Boolean(currentUser) &&
      (currentUser?.role === 'admin' || (authorId && currentUser?.id === authorId));

    if (canViewAllStatuses) {
      if (query.status === 'all') {
        where.status = undefined;
      } else if (requestedStatus) {
        where.status = requestedStatus;
      } else {
        where.status = 'published';
      }
    } else {
      where.status = 'published';
    }

    const categoryId = String(query.category ?? '').trim();
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    const keyword = String(query.keyword ?? '').trim();
    if (keyword) {
      where.OR = [
        {
          title: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: keyword,
            mode: 'insensitive'
          }
        }
      ];
    }

    const tagKeyword = String(query.tag ?? '').trim();
    if (tagKeyword) {
      where.tags = {
        some: {
          OR: [
            {
              tagId: tagKeyword
            },
            {
              tag: {
                slug: tagKeyword
              }
            },
            {
              tag: {
                name: {
                  contains: tagKeyword,
                  mode: 'insensitive'
                }
              }
            }
          ]
        }
      };
    }

    const sort = String(query.sort ?? 'latest').trim();
    let orderBy: Prisma.PostOrderByWithRelationInput[] = [{ isPinned: 'desc' }, { createdAt: 'desc' }];

    if (sort === 'hot') {
      orderBy = [{ likeCount: 'desc' }, { commentCount: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }];
    }

    if (sort === 'featured') {
      where.isFeatured = true;
      orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: postInclude,
        orderBy,
        skip,
        take: limit
      }),
      prisma.post.count({ where })
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
    const post = await prisma.post.findUnique({
      where: { id },
      include: postInclude
    });

    if (!post) {
      return null;
    }

    return canReadPost(post, currentUser) ? post : null;
  }

  async findById(id: string) {
    return prisma.post.findUnique({ where: { id } });
  }

  async createPost(payload: Record<string, unknown>, authorId: string) {
    const tagNames = normalizeTagNames(payload.tags);
    const title = String(payload.title ?? '');
    const content = String(payload.content ?? '');

    let status: PostStatus = ['draft', 'published', 'deleted', 'pending'].includes(String(payload.status ?? ''))
      ? (String(payload.status) as PostStatus)
      : 'published';

    // Only moderate when publishing (skip drafts)
    if (status === 'published') {
      const modResult = await moderationService.moderate('post', title, content);
      if (modResult.blocked) {
        throw new AppError(modResult.blockReason ?? '内容审核未通过', {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: modResult.blockReason }
        });
      }
      status = modResult.status as PostStatus;
    }

    const data: Prisma.PostCreateInput = {
      title,
      content,
      contentHtml: markdownToHtml(content),
      author: {
        connect: { id: authorId }
      },
      status
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

    if (tagNames.length > 0) {
      data.tags = {
        create: buildTagCreateInput(tagNames)
      };
    }

    return prisma.post.create({ data, include: postInclude });
  }

  async updatePost(id: string, payload: Record<string, unknown>) {
    const current = await prisma.post.findUnique({
      where: { id },
      select: {
        title: true,
        content: true,
        status: true
      }
    });

    if (!current) {
      return null;
    }

    const data: Prisma.PostUpdateInput = {};
    const nextTitle = payload.title !== undefined ? String(payload.title) : current.title;
    const nextContent = payload.content !== undefined ? String(payload.content) : current.content;
    const requestedStatus = payload.status !== undefined ? resolvePostStatus(payload.status) : undefined;
    let finalStatus: PostStatus = requestedStatus ?? current.status;

    if (payload.title !== undefined) {
      data.title = String(payload.title);
    }

    if (payload.content !== undefined) {
      const content = String(payload.content);
      data.content = content;
      data.contentHtml = markdownToHtml(content);
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

    if (payload.tags !== undefined) {
      const tagNames = normalizeTagNames(payload.tags);
      data.tags = {
        deleteMany: {},
        create: buildTagCreateInput(tagNames)
      };
    }

    const shouldModerate =
      finalStatus === 'published' &&
      (payload.title !== undefined || payload.content !== undefined || payload.status !== undefined);

    if (shouldModerate) {
      const modResult = await moderationService.moderate('post', nextTitle, nextContent);
      if (modResult.blocked) {
        throw new AppError(modResult.blockReason ?? '内容审核未通过', {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: modResult.blockReason }
        });
      }

      finalStatus = modResult.status as PostStatus;
      data.status = finalStatus;
    }

    try {
      return await prisma.post.update({
        where: { id },
        data,
        include: postInclude
      });
    } catch {
      return null;
    }
  }

  async remove(id: string) {
    const result = await prisma.post.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async incrementView(id: string) {
    try {
      return await prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      });
    } catch {
      return null;
    }
  }

  async like(id: string, userId: string) {
    const liked = await toggleLike(userId, 'post', id);
    const post = await this.detail(id);
    return {
      ...liked,
      post
    };
  }

  async favorite(id: string, userId: string) {
    const favorited = await toggleFavorite(userId, 'post', id);
    const post = await this.detail(id);
    return {
      ...favorited,
      post
    };
  }

  async getRelatedPosts(id: string) {
    const current = await prisma.post.findUnique({ where: { id }, select: { categoryId: true, title: true } });
    if (!current) {
      return [];
    }

    const where: Prisma.PostWhereInput = {
      id: { not: id },
      status: 'published'
    };

    if (current.categoryId) {
      where.categoryId = current.categoryId;
    }

    return prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  }
}

export const postService = new PostService();
