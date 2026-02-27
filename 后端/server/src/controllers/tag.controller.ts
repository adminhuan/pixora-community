import { CategoryType } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../config/database';
import { tagService } from '../services/tag.service';
import { AppError } from '../utils/AppError';
import { toSlug } from '../utils/helpers';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const resolveCategoryType = (value: unknown): CategoryType => {
  const type = String(value ?? '').trim();
  if (type === 'post' || type === 'blog' || type === 'project') {
    return type;
  }
  return 'post';
};

export const tagController = {
  async list(req: Request, res: Response) {
    const result = await tagService.list({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      keyword: String(req.query.keyword ?? ''),
      sort: String(req.query.sort ?? 'popular')
    });
    return sendPagedSuccess(res, result.data, result.pagination, '获取标签列表成功');
  },

  async detail(req: Request, res: Response) {
    const data = await tagService.detail(req.params.id);
    if (!data) throw new AppError('标签不存在', { statusCode: 404, code: 'TAG_NOT_FOUND' });
    return sendSuccess(res, data, '获取标签详情成功');
  },

  async contents(req: Request, res: Response) {
    const data = await tagService.contents(req.params.id, {
      type: String(req.query.type ?? 'all'),
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      sort: String(req.query.sort ?? 'latest')
    });
    return sendSuccess(res, data, '获取标签内容成功');
  },

  async hot(_req: Request, res: Response) {
    return sendSuccess(res, await tagService.hot(), '获取热门标签成功');
  },

  async follow(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const data = await tagService.follow(req.params.id, req.user.id);
    if (!data) throw new AppError('标签不存在', { statusCode: 404, code: 'TAG_NOT_FOUND' });
    return sendSuccess(res, data, '关注标签成功');
  },

  async unfollow(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const data = await tagService.unfollow(req.params.id, req.user.id);
    if (!data) throw new AppError('标签不存在', { statusCode: 404, code: 'TAG_NOT_FOUND' });
    return sendSuccess(res, data, '取消关注标签成功');
  },

  async categories(_req: Request, res: Response) {
    return sendSuccess(res, await tagService.categoriesTree(), '获取分类树成功');
  },

  async categoryContents(req: Request, res: Response) {
    return sendSuccess(res, await tagService.categoryContents(req.params.id), '获取分类内容成功');
  },

  async applyCategory(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const name = String(req.body?.name ?? '').trim();
    if (!name) {
      throw new AppError('分类名称不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const data = await tagService.applyCategory(
      {
        name,
        type: String(req.body?.type ?? 'post'),
        reason: String(req.body?.reason ?? '')
      },
      {
        id: req.user.id,
        username: req.user.username
      }
    );

    return sendSuccess(res, data, '分类申请已提交', 201);
  },

  async myCategoryApplications(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const data = await tagService.myCategoryApplications(req.user.id);
    return sendSuccess(res, data, '获取我的分类申请成功');
  },

  async adminCategoryApplications(req: Request, res: Response) {
    const data = await tagService.adminCategoryApplications(String(req.query.status ?? ''));
    return sendSuccess(res, data, '获取分类申请列表成功');
  },

  async adminReviewCategoryApplication(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const decision = String(req.body?.decision ?? '').trim();
    if (decision !== 'approve' && decision !== 'reject') {
      throw new AppError('审核决策必须为 approve 或 reject', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const data = await tagService.reviewCategoryApplication(req.params.id, req.user.id, {
      decision,
      comment: String(req.body?.comment ?? '')
    });

    if (!data) {
      throw new AppError('分类申请不存在', { statusCode: 404, code: 'CATEGORY_APPLICATION_NOT_FOUND' });
    }

    return sendSuccess(res, data, decision === 'approve' ? '分类申请已通过' : '分类申请已驳回');
  },

  async adminList(req: Request, res: Response) {
    const result = await tagService.list({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      keyword: String(req.query.keyword ?? ''),
      sort: String(req.query.sort ?? 'popular')
    });
    return sendPagedSuccess(res, result.data, result.pagination, '获取后台标签列表成功');
  },

  async adminCreate(req: Request, res: Response) {
    return sendSuccess(res, await tagService.create(req.body), '创建标签成功', 201);
  },

  async adminUpdate(req: Request, res: Response) {
    const data = await tagService.update(req.params.id, req.body);
    if (!data) throw new AppError('标签不存在', { statusCode: 404, code: 'TAG_NOT_FOUND' });
    return sendSuccess(res, data, '更新标签成功');
  },

  async adminDelete(req: Request, res: Response) {
    const removed = await tagService.remove(req.params.id);
    if (!removed) throw new AppError('标签不存在', { statusCode: 404, code: 'TAG_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除标签成功');
  },

  async adminMerge(req: Request, res: Response) {
    const result = await tagService.merge(req.body.fromId, req.body.toId);
    if (!result) throw new AppError('标签不存在', { statusCode: 404, code: 'TAG_NOT_FOUND' });
    return sendSuccess(res, result, '合并标签成功');
  },

  async adminCreateCategory(req: Request, res: Response) {
    const name = String(req.body?.name ?? '').trim();
    if (!name) {
      throw new AppError('分类名称不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const baseSlug = toSlug(String(req.body?.slug ?? name)) || `category-${Date.now()}`;
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

    const data = await prisma.category.create({
      data: {
        name,
        slug,
        description: req.body?.description ? String(req.body.description) : undefined,
        icon: req.body?.icon ? String(req.body.icon) : undefined,
        parentId: req.body?.parentId ? String(req.body.parentId) : null,
        order: Number(req.body?.order ?? 0),
        type: resolveCategoryType(req.body?.type),
        isActive: req.body?.isActive !== false
      }
    });

    return sendSuccess(res, data, '创建分类成功', 201);
  },

  async adminUpdateCategory(req: Request, res: Response) {
    const payload = req.body ?? {};
    const nextName = payload.name ? String(payload.name).trim() : undefined;
    const nextSlug = payload.slug ? toSlug(String(payload.slug)) : nextName ? toSlug(nextName) : undefined;

    try {
      const data = await prisma.category.update({
        where: { id: req.params.id },
        data: {
          name: nextName,
          slug: nextSlug,
          description: payload.description !== undefined ? String(payload.description ?? '') : undefined,
          icon: payload.icon !== undefined ? String(payload.icon ?? '') : undefined,
          parentId: payload.parentId !== undefined ? (payload.parentId ? String(payload.parentId) : null) : undefined,
          order: payload.order !== undefined ? Number(payload.order) : undefined,
          type: payload.type !== undefined ? resolveCategoryType(payload.type) : undefined,
          isActive: payload.isActive !== undefined ? payload.isActive !== false : undefined
        }
      });

      return sendSuccess(res, data, '更新分类成功');
    } catch {
      throw new AppError('分类不存在', { statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
    }
  },

  async adminDeleteCategory(req: Request, res: Response) {
    const id = req.params.id;

    const removed = await prisma.$transaction(async (tx) => {
      const exists = await tx.category.findUnique({ where: { id }, select: { id: true } });
      if (!exists) {
        return false;
      }

      await tx.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
      await tx.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
      await tx.blog.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
      await tx.project.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
      await tx.category.delete({ where: { id } });

      return true;
    });

    if (!removed) {
      throw new AppError('分类不存在', { statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
    }

    return sendSuccess(res, { id }, '删除分类成功');
  },

  async adminSortCategories(req: Request, res: Response) {
    const items = Array.isArray(req.body?.items)
      ? (req.body.items as Array<{ id?: string; order?: number }>)
      : Array.isArray(req.body)
        ? (req.body as Array<{ id?: string; order?: number }>)
        : [];

    await prisma.$transaction(
      items
        .filter((item) => item?.id)
        .map((item, index) =>
          prisma.category.updateMany({
            where: { id: String(item.id) },
            data: { order: Number(item.order ?? index + 1) }
          })
        )
    );

    return sendSuccess(res, { total: items.length }, '分类排序更新成功');
  }
};
