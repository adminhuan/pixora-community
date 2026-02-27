import { CategoryApplicationStatus, CategoryType, Prisma } from '@prisma/client';
import prisma from '../config/database';
import redis from '../config/redis';
import { AppError } from '../utils/AppError';
import { buildPagination, toSlug } from '../utils/helpers';
import { logger } from '../utils/logger';

const isCategoryType = (value: unknown): value is CategoryType => {
  return value === 'post' || value === 'blog' || value === 'project';
};

const isCategoryApplicationStatus = (value: unknown): value is CategoryApplicationStatus => {
  return value === 'pending' || value === 'approved' || value === 'rejected';
};

const resolveCategoryType = (value: unknown): CategoryType => {
  return isCategoryType(value) ? value : 'post';
};

const resolveCategoryApplicationStatus = (value: unknown): CategoryApplicationStatus | null => {
  return isCategoryApplicationStatus(value) ? value : null;
};

class TagService {
  async list(params: { page?: number; limit?: number; keyword?: string; sort?: string }) {
    const { page, limit, skip } = buildPagination(params.page, params.limit);
    const keyword = String(params.keyword ?? '').trim();
    const sort = String(params.sort ?? 'popular');

    const where: Prisma.TagWhereInput = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      : {};

    const orderBy: Prisma.TagOrderByWithRelationInput[] =
      sort === 'latest'
        ? [{ createdAt: 'desc' }]
        : sort === 'name'
          ? [{ name: 'asc' }]
          : [{ usageCount: 'desc' }, { followersCount: 'desc' }];

    const [data, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.tag.count({ where })
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
    return prisma.tag.findUnique({ where: { id } });
  }

  async contents(id: string, params: { type?: string; page?: number; limit?: number; sort?: string }) {
    const type = String(params.type ?? 'all');
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    if (type === 'post') {
      const [rows, total] = await Promise.all([
        prisma.postTag.findMany({
          where: { tagId: id },
          include: { post: true },
          orderBy: { post: { createdAt: 'desc' } },
          skip,
          take: limit
        }),
        prisma.postTag.count({ where: { tagId: id } })
      ]);
      return { id, type, items: rows.map((item) => item.post), page, limit, total };
    }

    if (type === 'blog') {
      const [rows, total] = await Promise.all([
        prisma.blogTag.findMany({
          where: { tagId: id },
          include: { blog: true },
          orderBy: { blog: { createdAt: 'desc' } },
          skip,
          take: limit
        }),
        prisma.blogTag.count({ where: { tagId: id } })
      ]);
      return { id, type, items: rows.map((item) => item.blog), page, limit, total };
    }

    if (type === 'question') {
      const [rows, total] = await Promise.all([
        prisma.questionTag.findMany({
          where: { tagId: id },
          include: { question: true },
          orderBy: { question: { createdAt: 'desc' } },
          skip,
          take: limit
        }),
        prisma.questionTag.count({ where: { tagId: id } })
      ]);
      return { id, type, items: rows.map((item) => item.question), page, limit, total };
    }

    if (type === 'snippet') {
      const [rows, total] = await Promise.all([
        prisma.snippetTag.findMany({
          where: { tagId: id },
          include: { snippet: true },
          orderBy: { snippet: { createdAt: 'desc' } },
          skip,
          take: limit
        }),
        prisma.snippetTag.count({ where: { tagId: id } })
      ]);
      return { id, type, items: rows.map((item) => item.snippet), page, limit, total };
    }

    const [posts, blogs, questions, snippets] = await Promise.all([
      prisma.postTag.findMany({ where: { tagId: id }, include: { post: true }, take: limit }),
      prisma.blogTag.findMany({ where: { tagId: id }, include: { blog: true }, take: limit }),
      prisma.questionTag.findMany({ where: { tagId: id }, include: { question: true }, take: limit }),
      prisma.snippetTag.findMany({ where: { tagId: id }, include: { snippet: true }, take: limit })
    ]);

    return {
      id,
      type: 'all',
      page,
      limit,
      items: {
        posts: posts.map((item) => item.post),
        blogs: blogs.map((item) => item.blog),
        questions: questions.map((item) => item.question),
        snippets: snippets.map((item) => item.snippet)
      }
    };
  }

  async hot() {
    const cacheKey = 'hot_tags';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Array<{ id: string; name: string; usageCount: number }>;
    }

    const data = await prisma.tag.findMany({
      orderBy: [{ usageCount: 'desc' }, { followersCount: 'desc' }],
      take: 20
    });
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 600);
    return data;
  }

  async follow(id: string, userId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const tag = await tx.tag.findUnique({ where: { id } });
        if (!tag) {
          return null;
        }

        const inserted = await tx.tagFollow.createMany({
          data: {
            userId,
            tagId: id
          },
          skipDuplicates: true
        });

        const nextTag =
          inserted.count > 0
            ? await tx.tag.update({
                where: { id },
                data: {
                  followersCount: {
                    increment: 1
                  }
                }
              })
            : tag;

        return {
          tag: nextTag,
          followed: true,
          changed: inserted.count > 0
        };
      });
    } catch (error) {
      logger.error('关注标签失败', { id, userId, error: (error as Error).message });
      return null;
    }
  }

  async unfollow(id: string, userId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const tag = await tx.tag.findUnique({ where: { id } });
        if (!tag) {
          return null;
        }

        const removed = await tx.tagFollow.deleteMany({
          where: {
            userId,
            tagId: id
          }
        });

        const nextTag =
          removed.count > 0
            ? await tx.tag.update({
                where: { id },
                data: {
                  followersCount: Math.max(tag.followersCount - removed.count, 0)
                }
              })
            : tag;

        return {
          tag: nextTag,
          followed: false,
          changed: removed.count > 0
        };
      });
    } catch (error) {
      logger.error('取消关注标签失败', { id, userId, error: (error as Error).message });
      return null;
    }
  }

  async categoriesTree() {
    const all = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    const byParent = new Map<string | undefined, typeof all>();
    all.forEach((item) => {
      const key = item.parentId ?? undefined;
      const list = byParent.get(key) ?? [];
      list.push(item);
      byParent.set(key, list);
    });

    type CategoryNode = (typeof all)[number] & { children: CategoryNode[] };

    const build = (parentId?: string): CategoryNode[] => {
      return (byParent.get(parentId) ?? []).map((item) => ({
        ...item,
        children: build(item.id)
      }));
    };

    return build(undefined);
  }

  async categoryContents(id: string) {
    const [posts, blogs, projects] = await Promise.all([
      prisma.post.findMany({ where: { categoryId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.blog.findMany({ where: { categoryId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.project.findMany({ where: { categoryId: id }, orderBy: { createdAt: 'desc' }, take: 20 })
    ]);

    return {
      categoryId: id,
      items: {
        posts,
        blogs,
        projects
      }
    };
  }

  private async ensureUniqueCategorySlug(baseSlug: string, tx: Prisma.TransactionClient) {
    let slug = baseSlug;
    let index = 1;

    for (let attempts = 0; attempts < 1000; attempts += 1) {
      const exists = await tx.category.findUnique({
        where: {
          slug
        },
        select: {
          id: true
        }
      });

      if (!exists) {
        return slug;
      }

      index += 1;
      slug = `${baseSlug}-${index}`;
    }

    throw new AppError('分类 slug 生成失败，请重试', {
      statusCode: 500,
      code: 'CATEGORY_SLUG_GENERATE_FAILED'
    });
  }

  async applyCategory(
    payload: {
      name: string;
      type?: string;
      reason?: string;
    },
    applicant: {
      id: string;
      username: string;
    }
  ) {
    const name = String(payload.name ?? '').trim();
    if (!name) {
      throw new AppError('分类名称不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const type = resolveCategoryType(payload.type);
    const slug = toSlug(name) || `category-${Date.now()}`;
    const reason = String(payload.reason ?? '').trim();

    const duplicate = await prisma.categoryApplication.findFirst({
      where: {
        applicantId: applicant.id,
        slug,
        type,
        status: 'pending'
      }
    });

    if (duplicate) {
      return duplicate;
    }

    return prisma.categoryApplication.create({
      data: {
        name,
        slug,
        type,
        reason: reason || null,
        applicantId: applicant.id,
        applicantName: applicant.username,
        status: 'pending'
      }
    });
  }

  async myCategoryApplications(userId: string) {
    return prisma.categoryApplication.findMany({
      where: {
        applicantId: userId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async adminCategoryApplications(status?: string) {
    const normalizedStatus = resolveCategoryApplicationStatus(String(status ?? '').trim());

    return prisma.categoryApplication.findMany({
      where: {
        status: normalizedStatus ?? undefined
      },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async reviewCategoryApplication(
    applicationId: string,
    reviewerId: string,
    payload: {
      decision?: string;
      comment?: string;
    }
  ) {
    const decision = String(payload.decision ?? '').trim();
    if (decision !== 'approve' && decision !== 'reject') {
      throw new AppError('审核决策必须为 approve 或 reject', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const comment = String(payload.comment ?? '').trim();

    return prisma.$transaction(async (tx) => {
      const application = await tx.categoryApplication.findUnique({
        where: {
          id: applicationId
        }
      });

      if (!application) {
        return null;
      }

      if (application.status !== 'pending') {
        const existingCategory =
          application.status === 'approved'
            ? await tx.category.findUnique({
                where: {
                  slug: application.slug
                },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true
                }
              })
            : null;

        return {
          application,
          category: existingCategory
        };
      }

      let category: {
        id: string;
        name: string;
        slug: string;
        type: CategoryType;
      } | null = null;

      if (decision === 'approve') {
        const categoryBySlug = await tx.category.findUnique({
          where: {
            slug: application.slug
          },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        });

        if (categoryBySlug && categoryBySlug.type === application.type) {
          category = categoryBySlug;
        } else {
          const finalSlug = await this.ensureUniqueCategorySlug(application.slug, tx);
          category = await tx.category.create({
            data: {
              name: application.name,
              slug: finalSlug,
              type: application.type,
              isActive: true,
              order: 0,
              description: application.reason || undefined
            },
            select: {
              id: true,
              name: true,
              slug: true,
              type: true
            }
          });
        }
      }

      const updated = await tx.categoryApplication.update({
        where: {
          id: application.id
        },
        data: {
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewComment: comment || null,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          slug: category?.slug ?? application.slug
        }
      });

      return {
        application: updated,
        category
      };
    });
  }

  async create(payload: Record<string, unknown>) {
    const name = String(payload.name ?? '').trim();
    const slug = payload.slug ? String(payload.slug) : toSlug(name);

    return prisma.tag.create({
      data: {
        name,
        slug,
        description: payload.description ? String(payload.description) : undefined,
        icon: payload.icon ? String(payload.icon) : undefined,
        aliases: Array.isArray(payload.aliases) ? payload.aliases.map((item) => String(item)) : []
      }
    });
  }

  async update(id: string, payload: Record<string, unknown>) {
    try {
      return await prisma.tag.update({
        where: { id },
        data: {
          name: payload.name ? String(payload.name) : undefined,
          slug: payload.slug ? String(payload.slug) : undefined,
          description: payload.description !== undefined ? String(payload.description ?? '') : undefined,
          icon: payload.icon !== undefined ? String(payload.icon ?? '') : undefined,
          aliases: Array.isArray(payload.aliases) ? payload.aliases.map((item) => String(item)) : undefined
        }
      });
    } catch (error) {
      logger.error('更新标签失败', { id, error: (error as Error).message });
      return null;
    }
  }

  async remove(id: string) {
    const result = await prisma.tag.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async merge(fromId: string, toId: string) {
    return prisma.$transaction(async (tx) => {
      const from = await tx.tag.findUnique({ where: { id: fromId } });
      const to = await tx.tag.findUnique({ where: { id: toId } });
      if (!from || !to) {
        return null;
      }

      const fromFollowers = await tx.tagFollow.findMany({
        where: { tagId: fromId },
        select: { userId: true }
      });

      if (fromFollowers.length > 0) {
        await tx.tagFollow.createMany({
          data: fromFollowers.map((item) => ({ userId: item.userId, tagId: toId })),
          skipDuplicates: true
        });
      }

      await tx.tagFollow.deleteMany({ where: { tagId: fromId } });

      await tx.postTag.updateMany({ where: { tagId: fromId }, data: { tagId: toId } });
      await tx.blogTag.updateMany({ where: { tagId: fromId }, data: { tagId: toId } });
      await tx.snippetTag.updateMany({ where: { tagId: fromId }, data: { tagId: toId } });
      await tx.questionTag.updateMany({ where: { tagId: fromId }, data: { tagId: toId } });

      const followerCount = await tx.tagFollow.count({ where: { tagId: toId } });

      await tx.tag.update({
        where: { id: toId },
        data: {
          usageCount: {
            increment: from.usageCount
          },
          followersCount: followerCount
        }
      });

      await tx.tag.delete({ where: { id: fromId } });

      return {
        mergedFrom: fromId,
        mergedTo: toId
      };
    });
  }
}

export const tagService = new TagService();
