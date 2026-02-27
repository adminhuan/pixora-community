import { ContentType, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AuthUser } from '../types/common';
import { AppError } from '../utils/AppError';

type FavoriteAuthor = {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
};

type FavoriteTargetMeta = {
  title: string;
  summary: string;
  createdAt: Date | null;
  author: FavoriteAuthor | null;
  path: string;
};

const favoriteTypeLabelMap: Record<ContentType, string> = {
  post: '帖子',
  blog: '博客',
  project: '项目',
  snippet: '代码',
  question: '问题',
  answer: '回答',
  comment: '评论'
};

const compactText = (value: unknown, limit = 120) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);

class UserService {
  private buildFavoriteFallbackTitle(targetType: ContentType, targetId: string) {
    const label = favoriteTypeLabelMap[targetType] ?? '内容';
    const suffix = String(targetId ?? '').slice(0, 8);
    return `${label} #${suffix || targetId}`;
  }

  private buildContentPath(targetType: ContentType | string, targetId: string) {
    const id = String(targetId ?? '').trim();
    if (!id) {
      return '';
    }

    if (targetType === 'post') {
      return `/forum/${id}`;
    }
    if (targetType === 'blog') {
      return `/blog/${id}`;
    }
    if (targetType === 'project') {
      return `/projects/${id}`;
    }
    if (targetType === 'snippet') {
      return `/code/${id}`;
    }
    if (targetType === 'question') {
      return `/qa/${id}`;
    }

    return '';
  }

  private async resolveFavoriteTargets(favorites: Array<{ targetType: ContentType; targetId: string }>) {
    const idsByType: Record<ContentType, string[]> = {
      post: [],
      blog: [],
      project: [],
      snippet: [],
      question: [],
      answer: [],
      comment: []
    };

    favorites.forEach((item) => {
      const targetId = String(item.targetId ?? '').trim();
      if (!targetId) {
        return;
      }
      idsByType[item.targetType].push(targetId);
    });

    const uniqueIdsByType: Record<ContentType, string[]> = {
      post: Array.from(new Set(idsByType.post)),
      blog: Array.from(new Set(idsByType.blog)),
      project: Array.from(new Set(idsByType.project)),
      snippet: Array.from(new Set(idsByType.snippet)),
      question: Array.from(new Set(idsByType.question)),
      answer: Array.from(new Set(idsByType.answer)),
      comment: Array.from(new Set(idsByType.comment))
    };

    const [posts, blogs, projects, snippets, questions, answers, comments] = await Promise.all([
      prisma.post.findMany({
        where: { id: { in: uniqueIdsByType.post } },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      }),
      prisma.blog.findMany({
        where: { id: { in: uniqueIdsByType.blog } },
        select: {
          id: true,
          title: true,
          summary: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      }),
      prisma.project.findMany({
        where: { id: { in: uniqueIdsByType.project } },
        select: {
          id: true,
          name: true,
          description: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      }),
      prisma.codeSnippet.findMany({
        where: { id: { in: uniqueIdsByType.snippet } },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      }),
      prisma.question.findMany({
        where: { id: { in: uniqueIdsByType.question } },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      }),
      prisma.answer.findMany({
        where: { id: { in: uniqueIdsByType.answer } },
        select: {
          id: true,
          content: true,
          createdAt: true,
          questionId: true,
          question: { select: { title: true } },
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      }),
      prisma.comment.findMany({
        where: { id: { in: uniqueIdsByType.comment } },
        select: {
          id: true,
          content: true,
          createdAt: true,
          targetType: true,
          targetId: true,
          author: { select: { id: true, username: true, nickname: true, avatar: true } }
        }
      })
    ]);

    const commentToAnswerIds = Array.from(
      new Set(
        comments
          .filter((item) => item.targetType === 'answer')
          .map((item) => String(item.targetId ?? '').trim())
          .filter(Boolean)
      )
    );

    const commentAnswerMap = new Map<string, string>();

    if (commentToAnswerIds.length > 0) {
      const commentAnswerTargets = await prisma.answer.findMany({
        where: { id: { in: commentToAnswerIds } },
        select: { id: true, questionId: true }
      });

      commentAnswerTargets.forEach((item) => {
        commentAnswerMap.set(item.id, `/qa/${item.questionId}#answer-${item.id}`);
      });
    }

    const targetMap = new Map<string, FavoriteTargetMeta>();

    posts.forEach((item) => {
      targetMap.set(`post:${item.id}`, {
        title: item.title,
        summary: compactText(item.content),
        createdAt: item.createdAt,
        author: item.author,
        path: this.buildContentPath('post', item.id)
      });
    });

    blogs.forEach((item) => {
      targetMap.set(`blog:${item.id}`, {
        title: item.title,
        summary: compactText(item.summary ?? item.content),
        createdAt: item.createdAt,
        author: item.author,
        path: this.buildContentPath('blog', item.id)
      });
    });

    projects.forEach((item) => {
      targetMap.set(`project:${item.id}`, {
        title: item.name,
        summary: compactText(item.description ?? item.content),
        createdAt: item.createdAt,
        author: item.author,
        path: this.buildContentPath('project', item.id)
      });
    });

    snippets.forEach((item) => {
      targetMap.set(`snippet:${item.id}`, {
        title: item.title,
        summary: compactText(item.description),
        createdAt: item.createdAt,
        author: item.author,
        path: this.buildContentPath('snippet', item.id)
      });
    });

    questions.forEach((item) => {
      targetMap.set(`question:${item.id}`, {
        title: item.title,
        summary: compactText(item.content),
        createdAt: item.createdAt,
        author: item.author,
        path: this.buildContentPath('question', item.id)
      });
    });

    answers.forEach((item) => {
      targetMap.set(`answer:${item.id}`, {
        title: item.question?.title ? `回答：${item.question.title}` : '回答内容',
        summary: compactText(item.content),
        createdAt: item.createdAt,
        author: item.author,
        path: `/qa/${item.questionId}#answer-${item.id}`
      });
    });

    comments.forEach((item) => {
      const path =
        item.targetType === 'answer'
          ? (commentAnswerMap.get(String(item.targetId ?? '').trim()) ?? '')
          : this.buildContentPath(item.targetType, String(item.targetId ?? ''));

      targetMap.set(`comment:${item.id}`, {
        title: '评论内容',
        summary: compactText(item.content),
        createdAt: item.createdAt,
        author: item.author,
        path
      });
    });

    return targetMap;
  }

  async privateProfile(id: string) {
    const profile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        coverImage: true,
        nickname: true,
        bio: true,
        signature: true,
        role: true,
        status: true,
        points: true,
        level: true,
        notificationSettings: true,
        position: true,
        company: true,
        city: true,
        website: true,
        github: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            answers: true,
            blogs: true,
            projects: true,
            snippets: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      postsCount: profile._count.posts,
      answersCount: profile._count.answers,
      blogsCount: profile._count.blogs,
      projectsCount: profile._count.projects,
      snippetsCount: profile._count.snippets,
      followersCount: profile._count.followers,
      followingCount: profile._count.following,
      _count: undefined
    };
  }

  async publicProfile(id: string) {
    const profile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        coverImage: true,
        nickname: true,
        bio: true,
        signature: true,
        role: true,
        points: true,
        level: true,
        position: true,
        company: true,
        city: true,
        website: true,
        github: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            answers: true,
            blogs: true,
            projects: true,
            snippets: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      postsCount: profile._count.posts,
      answersCount: profile._count.answers,
      blogsCount: profile._count.blogs,
      projectsCount: profile._count.projects,
      snippetsCount: profile._count.snippets,
      followersCount: profile._count.followers,
      followingCount: profile._count.following,
      _count: undefined
    };
  }

  async updateProfile(userId: string, payload: Record<string, unknown>) {
    const username = payload.username !== undefined ? String(payload.username).trim() : undefined;
    const email = payload.email !== undefined ? String(payload.email).trim().toLowerCase() : undefined;

    if (username) {
      const existed = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        },
        select: { id: true }
      });

      if (existed) {
        throw new AppError('用户名已被占用', { statusCode: 400, code: 'USERNAME_TAKEN' });
      }
    }

    if (email) {
      const existed = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        },
        select: { id: true }
      });

      if (existed) {
        throw new AppError('邮箱已被占用', { statusCode: 400, code: 'EMAIL_TAKEN' });
      }
    }

    const data = {
      username,
      email,
      nickname: payload.nickname !== undefined ? String(payload.nickname) : undefined,
      bio: payload.bio !== undefined ? String(payload.bio) : undefined,
      signature: payload.signature !== undefined ? String(payload.signature) : undefined,
      avatar: payload.avatar !== undefined ? String(payload.avatar) : undefined,
      coverImage: payload.coverImage !== undefined ? String(payload.coverImage) : undefined,
      position: payload.position !== undefined ? String(payload.position) : undefined,
      company: payload.company !== undefined ? String(payload.company) : undefined,
      city: payload.city !== undefined ? String(payload.city) : undefined,
      website: payload.website !== undefined ? String(payload.website) : undefined,
      github: payload.github !== undefined ? String(payload.github) : undefined
    };

    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        coverImage: true,
        nickname: true,
        bio: true,
        signature: true,
        position: true,
        company: true,
        city: true,
        website: true,
        github: true,
        updatedAt: true
      }
    });
  }

  async updateSettings(userId: string, payload: Record<string, unknown>) {
    const notificationSettings = (payload.notificationSettings as Record<string, unknown> | undefined) ?? {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationSettings: notificationSettings as Prisma.InputJsonValue
      },
      select: {
        notificationSettings: true
      }
    });

    return {
      notificationSettings: updated.notificationSettings
    };
  }

  async contentByType(
    userId: string,
    type: 'posts' | 'blogs' | 'projects' | 'snippets' | 'answers',
    currentUser?: AuthUser
  ) {
    const canViewPrivate =
      Boolean(currentUser) && (currentUser?.role === 'admin' || currentUser?.id === userId);

    if (type === 'posts') {
      return prisma.post.findMany({
        where: {
          authorId: userId,
          ...(canViewPrivate ? {} : { status: 'published' })
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    if (type === 'blogs') {
      return prisma.blog.findMany({
        where: {
          authorId: userId,
          ...(canViewPrivate ? {} : { status: 'published' })
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    if (type === 'projects') {
      return prisma.project.findMany({ where: { authorId: userId }, orderBy: { createdAt: 'desc' } });
    }
    if (type === 'snippets') {
      return prisma.codeSnippet.findMany({
        where: {
          authorId: userId,
          ...(canViewPrivate ? {} : { visibility: 'public' })
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return prisma.answer.findMany({ where: { authorId: userId }, orderBy: { createdAt: 'desc' } });
  }

  async followers(userId: string) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
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

  async following(userId: string) {
    return prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
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

  async favorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        folder: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!favorites.length) {
      return [];
    }

    const targetMap = await this.resolveFavoriteTargets(
      favorites.map((item) => ({ targetType: item.targetType, targetId: item.targetId }))
    );

    return favorites.map((item) => {
      const target = targetMap.get(`${item.targetType}:${item.targetId}`);

      return {
        ...item,
        targetTitle: target?.title ?? this.buildFavoriteFallbackTitle(item.targetType, item.targetId),
        targetSummary: target?.summary ?? '',
        targetAuthor: target?.author ?? null,
        targetCreatedAt: target?.createdAt ?? null,
        targetPath: target?.path ?? this.buildContentPath(item.targetType, item.targetId)
      };
    });
  }

  async createFavoriteFolder(userId: string, name: string) {
    return prisma.favoriteFolder.create({
      data: {
        userId,
        name
      }
    });
  }

  async updateFavoriteFolder(userId: string, id: string, name: string) {
    const folder = await prisma.favoriteFolder.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!folder) {
      return null;
    }

    return prisma.favoriteFolder.update({
      where: {
        id
      },
      data: {
        name
      }
    });
  }

  async deleteFavoriteFolder(userId: string, id: string) {
    const folder = await prisma.favoriteFolder.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!folder) {
      return false;
    }

    await prisma.$transaction([
      prisma.favorite.updateMany({
        where: {
          folderId: id
        },
        data: {
          folderId: null
        }
      }),
      prisma.favoriteFolder.delete({
        where: {
          id
        }
      })
    ]);

    return true;
  }

  async contributions(userId: string) {
    const [posts, blogs, projects, snippets, answers] = await Promise.all([
      prisma.post.findMany({ where: { authorId: userId }, select: { createdAt: true } }),
      prisma.blog.findMany({ where: { authorId: userId }, select: { createdAt: true } }),
      prisma.project.findMany({ where: { authorId: userId }, select: { createdAt: true } }),
      prisma.codeSnippet.findMany({ where: { authorId: userId }, select: { createdAt: true } }),
      prisma.answer.findMany({ where: { authorId: userId }, select: { createdAt: true } })
    ]);

    const map = new Map<string, number>();
    [...posts, ...blogs, ...projects, ...snippets, ...answers].forEach((item) => {
      const date = item.createdAt.toISOString().slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async achievements(userId: string) {
    return prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    });
  }

  async points(userId: string, type?: string) {
    return prisma.pointsLog.findMany({
      where: {
        userId,
        type: type && type !== 'all' ? (type as 'earn' | 'spend') : undefined
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async level(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        points: true,
        level: true
      }
    });

    return {
      userId,
      points: user?.points ?? 0,
      level: user?.level ?? 1
    };
  }
}

export const userService = new UserService();
