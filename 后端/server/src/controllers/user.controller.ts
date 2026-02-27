import { Request, Response } from 'express';
import { followService } from '../services/follow.service';
import { uploadService } from '../services/upload.service';
import { userService } from '../services/user.service';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';

const resolveUserId = (req: Request, rawId: string) => {
  const id = String(rawId ?? '').trim();

  if (id === 'me') {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    return req.user.id;
  }

  return id;
};

export const userController = {
  async me(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const data = await userService.privateProfile(req.user.id);
    if (!data) {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }

    return sendSuccess(res, data, '获取当前用户信息成功');
  },

  async profile(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    const data = await userService.publicProfile(userId);
    if (!data) throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    return sendSuccess(res, data, '获取用户信息成功');
  },

  async updateProfile(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const data = await userService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, data, '更新个人资料成功');
  },

  async updateSettings(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const data = await userService.updateSettings(req.user.id, req.body ?? {});
    return sendSuccess(res, data, '更新设置成功');
  },

  async uploadAvatar(req: Request, res: Response) {
    if (!req.file) throw new AppError('缺少上传文件', { statusCode: 400, code: 'FILE_REQUIRED' });
    const data = await uploadService.uploadImage(req.file, 'avatar');
    return sendSuccess(res, data, '上传头像成功', 201);
  },

  async uploadCover(req: Request, res: Response) {
    if (!req.file) throw new AppError('缺少上传文件', { statusCode: 400, code: 'FILE_REQUIRED' });
    const data = await uploadService.uploadImage(req.file, 'default');
    return sendSuccess(res, data, '上传封面成功', 201);
  },

  async posts(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.contentByType(userId, 'posts', req.user), '获取用户帖子成功');
  },

  async blogs(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.contentByType(userId, 'blogs', req.user), '获取用户博客成功');
  },

  async projects(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.contentByType(userId, 'projects', req.user), '获取用户项目成功');
  },

  async snippets(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.contentByType(userId, 'snippets', req.user), '获取用户代码分享成功');
  },

  async answers(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.contentByType(userId, 'answers', req.user), '获取用户回答成功');
  },

  async followers(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.followers(userId), '获取粉丝列表成功');
  },

  async following(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.following(userId), '获取关注列表成功');
  },

  async follow(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const targetUserId = resolveUserId(req, req.params.id);
    if (targetUserId === req.user.id) {
      throw new AppError('不能关注自己', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    return sendSuccess(res, await followService.follow(req.user.id, targetUserId), '关注成功');
  },

  async unfollow(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const targetUserId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await followService.unfollow(req.user.id, targetUserId), '取消关注成功');
  },

  async favorites(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const userId = resolveUserId(req, req.params.id);
    if (userId !== req.user.id) {
      throw new AppError('权限不足', { statusCode: 403, code: 'FORBIDDEN' });
    }

    return sendSuccess(res, await userService.favorites(userId), '获取收藏列表成功');
  },

  async createFavoriteFolder(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const name = String(req.body.name ?? '').trim();
    if (!name) {
      throw new AppError('收藏夹名称不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const folder = await userService.createFavoriteFolder(req.user.id, name);
    return sendSuccess(res, folder, '创建收藏夹成功', 201);
  },

  async updateFavoriteFolder(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const name = String(req.body.name ?? '').trim();
    if (!name) {
      throw new AppError('收藏夹名称不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const folder = await userService.updateFavoriteFolder(req.user.id, req.params.id, name);
    if (!folder) {
      throw new AppError('收藏夹不存在', { statusCode: 404, code: 'FAVORITE_FOLDER_NOT_FOUND' });
    }

    return sendSuccess(res, folder, '更新收藏夹成功');
  },

  async deleteFavoriteFolder(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const removed = await userService.deleteFavoriteFolder(req.user.id, req.params.id);
    if (!removed) {
      throw new AppError('收藏夹不存在', { statusCode: 404, code: 'FAVORITE_FOLDER_NOT_FOUND' });
    }
    return sendSuccess(res, { id: req.params.id }, '删除收藏夹成功');
  },

  async contributions(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.contributions(userId), '获取贡献热力图成功');
  },

  async achievements(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.achievements(userId), '获取成就列表成功');
  },

  async points(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.points(userId, String(req.query.type ?? 'all')), '获取积分明细成功');
  },

  async level(req: Request, res: Response) {
    const userId = resolveUserId(req, req.params.id);
    return sendSuccess(res, await userService.level(userId), '获取等级信息成功');
  }
};
