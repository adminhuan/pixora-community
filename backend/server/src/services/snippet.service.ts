import path from 'path';
import { Prisma, SnippetVisibility } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { buildPagination, toSlug } from '../utils/helpers';
import { AuthUser } from '../types/common';
import { toggleFavorite, toggleLike } from './interaction.service';
import { sensitiveWordService } from './sensitiveWord.service';

interface SnippetFileInput {
  filename: string;
  language: string;
  content: string;
}

interface SnippetListQuery {
  page?: string | number;
  limit?: string | number;
  visibility?: string;
  authorId?: string;
  type?: string;
  category?: string;
  framework?: string;
  keyword?: string;
  sort?: string;
  isRecommended?: string;
  isFeatured?: string;
  likedBy?: string;
  favoritedBy?: string;
  includeFiles?: string;
}

const snippetAuthorSelect = {
  id: true,
  username: true,
  nickname: true,
  avatar: true
} satisfies Prisma.UserSelect;

const snippetListIncludeWithFiles = {
  author: {
    select: snippetAuthorSelect
  },
  files: {
    select: {
      id: true,
      filename: true,
      language: true,
      content: true,
      snippetId: true
    }
  }
} satisfies Prisma.CodeSnippetInclude;

const snippetListIncludeMeta = {
  author: {
    select: snippetAuthorSelect
  }
} satisfies Prisma.CodeSnippetInclude;

const snippetDetailInclude = {
  author: {
    select: snippetAuthorSelect
  },
  files: true,
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.CodeSnippetInclude;

const detectLanguage = (filename: string): string => {
  const ext = path.extname(filename).replace('.', '').toLowerCase();
  if (ext === 'ts' || ext === 'tsx') return 'typescript';
  if (ext === 'js' || ext === 'jsx') return 'javascript';
  if (ext === 'py') return 'python';
  if (ext === 'go') return 'go';
  if (ext === 'java') return 'java';
  if (ext === 'rs') return 'rust';
  return ext || 'plaintext';
};

const normalizeFiles = (files: unknown): SnippetFileInput[] => {
  if (!Array.isArray(files)) {
    return [];
  }

  const normalized: Array<{ filename: string; language?: string; content: string }> = files.map((item) => {
    const source = item as Record<string, unknown>;
    return {
      filename: String(source.filename ?? ''),
      language: source.language ? String(source.language) : undefined,
      content: String(source.content ?? '')
    };
  });

  return normalized
    .filter((item) => Boolean(item.filename) && Boolean(item.content))
    .map((item) => ({
      filename: item.filename,
      language: item.language ?? detectLanguage(item.filename),
      content: item.content
    }));
};

const normalizeTagNames = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  return Array.from(new Set(tags.map((item) => String(item).trim()).filter(Boolean)));
};

const buildTagCreateInput = (tags: string[]): Prisma.SnippetTagCreateWithoutSnippetInput[] => {
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

const VALID_TYPES = ['component', 'snippet'];
const VALID_FRAMEWORKS = ['css', 'tailwind', 'react', 'vue', 'svelte'];
const VALID_CATEGORIES = [
  'buttons',
  'cards',
  'loaders',
  'inputs',
  'toggles',
  'checkboxes',
  'forms',
  'patterns',
  'alerts',
  'modals',
  'navbars',
  'footers',
  'other'
];

const canReadSnippet = (
  snippet: { visibility: SnippetVisibility; authorId: string },
  currentUser?: AuthUser
): boolean => {
  if (snippet.visibility === 'public') {
    return true;
  }

  if (!currentUser) {
    return false;
  }

  return currentUser.role === 'admin' || currentUser.id === snippet.authorId;
};

const attachUserStatus = async (snippets: unknown[], userId?: string) => {
  if (!userId || snippets.length === 0) return snippets;
  const ids = (snippets as Array<{ id: string }>).map((s) => s.id);
  const [likes, favs] = await Promise.all([
    prisma.like.findMany({
      where: { userId, targetType: 'snippet', targetId: { in: ids } },
      select: { targetId: true }
    }),
    prisma.favorite.findMany({
      where: { userId, targetType: 'snippet', targetId: { in: ids } },
      select: { targetId: true }
    })
  ]);
  const likedSet = new Set(likes.map((l) => l.targetId));
  const favSet = new Set(favs.map((f) => f.targetId));
  return (snippets as Array<Record<string, unknown>>).map((s) => ({
    ...s,
    isLiked: likedSet.has(s.id as string),
    isFavorited: favSet.has(s.id as string)
  }));
};

class SnippetService {
  async list(query: SnippetListQuery, currentUser?: AuthUser) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const where: Prisma.CodeSnippetWhereInput = {};

    const authorId = String(query.authorId ?? '').trim();
    if (authorId) {
      where.authorId = authorId;
    }

    const requestedVisibility =
      query.visibility && ['public', 'private'].includes(query.visibility)
        ? (query.visibility as SnippetVisibility)
        : undefined;

    const canViewPrivate =
      Boolean(currentUser) && (currentUser?.role === 'admin' || (authorId && currentUser?.id === authorId));

    if (canViewPrivate) {
      if (requestedVisibility) {
        where.visibility = requestedVisibility;
      }
    } else {
      where.visibility = 'public';
    }

    if (query.type && VALID_TYPES.includes(query.type)) {
      where.type = query.type;
    }

    if (query.category && VALID_CATEGORIES.includes(query.category)) {
      where.category = query.category;
    }

    if (query.framework && VALID_FRAMEWORKS.includes(query.framework)) {
      where.framework = query.framework;
    }

    if (query.isRecommended === 'true') {
      where.isRecommended = true;
    }

    if (query.isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (query.likedBy) {
      const likedIds = await prisma.like.findMany({
        where: { userId: query.likedBy, targetType: 'snippet' },
        select: { targetId: true },
        orderBy: { createdAt: 'desc' }
      });
      where.id = { in: likedIds.map((l) => l.targetId) };
    }

    if (query.favoritedBy) {
      const favIds = await prisma.favorite.findMany({
        where: { userId: query.favoritedBy, targetType: 'snippet' },
        select: { targetId: true },
        orderBy: { createdAt: 'desc' }
      });
      const idFilter = where.id as Prisma.StringFilter | undefined;
      if (idFilter?.in) {
        where.id = { in: (idFilter.in as string[]).filter((id) => favIds.some((f) => f.targetId === id)) };
      } else {
        where.id = { in: favIds.map((f) => f.targetId) };
      }
    }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } }
      ];
    }

    const includeFiles = query.includeFiles !== 'false';
    const include = includeFiles ? snippetListIncludeWithFiles : snippetListIncludeMeta;

    let orderBy: Prisma.CodeSnippetOrderByWithRelationInput = { createdAt: 'desc' };
    switch (query.sort) {
      case 'popular':
        orderBy = { likeCount: 'desc' };
        break;
      case 'views':
        orderBy = { viewCount: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
    }

    const [rawData, total] = await Promise.all([
      prisma.codeSnippet.findMany({
        where,
        include,
        orderBy,
        skip,
        take: limit
      }),
      prisma.codeSnippet.count({ where })
    ]);

    const data = await attachUserStatus(rawData, currentUser?.id);

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
    const snippet = await prisma.codeSnippet.findUnique({ where: { id }, include: snippetDetailInclude });
    if (!snippet) return null;
    if (!canReadSnippet(snippet, currentUser)) {
      return null;
    }

    const [enriched] = (await attachUserStatus([snippet], currentUser?.id)) as Array<
      typeof snippet & { isLiked: boolean; isFavorited: boolean }
    >;
    return enriched;
  }

  async findById(id: string) {
    return prisma.codeSnippet.findUnique({ where: { id } });
  }

  async incrementView(id: string) {
    try {
      return await prisma.codeSnippet.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      });
    } catch {
      return null;
    }
  }

  async createSnippet(payload: Record<string, unknown>, authorId: string) {
    const files = normalizeFiles(payload.files);
    const tags = normalizeTagNames(payload.tags);
    const title = String(payload.title ?? '');
    const description = payload.description ? String(payload.description) : '';

    const visibility = ['public', 'private'].includes(String(payload.visibility ?? ''))
      ? (String(payload.visibility) as SnippetVisibility)
      : 'public';

    const type = VALID_TYPES.includes(String(payload.type ?? '')) ? String(payload.type) : 'component';

    const category = VALID_CATEGORIES.includes(String(payload.category ?? '')) ? String(payload.category) : undefined;

    const framework = VALID_FRAMEWORKS.includes(String(payload.framework ?? '')) ? String(payload.framework) : 'css';

    const fileContents = files.map((file) => file.content);
    const sensitiveResult = sensitiveWordService.checkFields(title, description, ...fileContents);
    if (sensitiveResult.hit) {
      throw new AppError(`内容包含敏感词：${sensitiveResult.word ?? ''}`, {
        statusCode: 403,
        code: 'CONTENT_BLOCKED',
        details: { reason: `内容包含敏感词：${sensitiveResult.word ?? ''}` }
      });
    }

    return prisma.codeSnippet.create({
      data: {
        title,
        description: description || undefined,
        visibility,
        type,
        category,
        framework,
        author: {
          connect: { id: authorId }
        },
        files: {
          create: files
        },
        versions: {
          create: {
            message: payload.versionMessage ? String(payload.versionMessage) : 'initial version',
            files: files as unknown as Prisma.InputJsonValue
          }
        },
        tags: {
          create: buildTagCreateInput(tags)
        }
      },
      include: snippetDetailInclude
    });
  }

  async updateSnippet(id: string, payload: Record<string, unknown>) {
    const current = await prisma.codeSnippet.findUnique({
      where: { id },
      include: {
        files: {
          select: {
            content: true
          }
        }
      }
    });

    if (!current) {
      return null;
    }

    const data: Prisma.CodeSnippetUpdateInput = {};

    const nextTitle = payload.title !== undefined ? String(payload.title) : current.title;
    const nextDescription =
      payload.description !== undefined ? String(payload.description ?? '') : String(current.description ?? '');

    const shouldCheckSensitive =
      payload.title !== undefined || payload.description !== undefined || payload.files !== undefined;
    if (shouldCheckSensitive) {
      const incomingFiles = payload.files !== undefined ? normalizeFiles(payload.files) : null;
      const nextFileContents = incomingFiles
        ? incomingFiles.map((file) => file.content)
        : current.files.map((file) => file.content);

      const sensitiveResult = sensitiveWordService.checkFields(nextTitle, nextDescription, ...nextFileContents);
      if (sensitiveResult.hit) {
        throw new AppError(`内容包含敏感词：${sensitiveResult.word ?? ''}`, {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: `内容包含敏感词：${sensitiveResult.word ?? ''}` }
        });
      }
    }

    if (payload.title !== undefined) {
      data.title = String(payload.title);
    }

    if (payload.description !== undefined) {
      data.description = payload.description ? String(payload.description) : null;
    }

    if (payload.visibility !== undefined) {
      const visibility = String(payload.visibility);
      if (visibility === 'public' || visibility === 'private') {
        data.visibility = visibility as SnippetVisibility;
      }
    }

    if (payload.type !== undefined) {
      const type = String(payload.type);
      if (VALID_TYPES.includes(type)) {
        data.type = type;
      }
    }

    if (payload.category !== undefined) {
      const category = String(payload.category);
      data.category = VALID_CATEGORIES.includes(category) ? category : null;
    }

    if (payload.framework !== undefined) {
      const framework = String(payload.framework);
      if (VALID_FRAMEWORKS.includes(framework)) {
        data.framework = framework;
      }
    }

    if (payload.tags !== undefined) {
      const tags = normalizeTagNames(payload.tags);
      data.tags = {
        deleteMany: {},
        create: buildTagCreateInput(tags)
      };
    }

    if (payload.files !== undefined) {
      const files = normalizeFiles(payload.files);
      data.files = {
        deleteMany: {},
        create: files
      };
      data.versions = {
        create: {
          message: payload.versionMessage ? String(payload.versionMessage) : 'update',
          files: files as unknown as Prisma.InputJsonValue
        }
      };
    }

    try {
      return await prisma.codeSnippet.update({
        where: { id },
        data,
        include: snippetDetailInclude
      });
    } catch {
      return null;
    }
  }

  async remove(id: string) {
    const result = await prisma.codeSnippet.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async forkSnippet(id: string, currentUser: AuthUser) {
    const source = await this.detail(id, currentUser);
    if (!source) {
      return null;
    }

    const sourceFiles = source.files.map((file) => ({
      filename: file.filename,
      language: file.language,
      content: file.content
    }));

    await prisma.codeSnippet.update({
      where: { id },
      data: {
        forkCount: {
          increment: 1
        }
      }
    });

    return prisma.codeSnippet.create({
      data: {
        title: `${source.title} (fork)`,
        description: source.description,
        visibility: 'public',
        type: source.type,
        category: source.category,
        framework: source.framework,
        forkedFromId: source.id,
        author: {
          connect: { id: currentUser.id }
        },
        files: {
          create: sourceFiles
        },
        versions: {
          create: {
            message: 'fork from source',
            files: sourceFiles as unknown as Prisma.InputJsonValue
          }
        },
        tags: {
          create: source.tags.map((item) => ({
            tag: {
              connect: {
                id: item.tagId
              }
            }
          }))
        }
      },
      include: snippetDetailInclude
    });
  }

  async like(id: string, currentUser: AuthUser) {
    const snippet = await this.detail(id, currentUser);
    if (!snippet) {
      return {
        liked: false,
        likeCount: 0,
        snippet: null
      };
    }

    const liked = await toggleLike(currentUser.id, 'snippet', id);
    const nextSnippet = await this.detail(id, currentUser);
    return {
      ...liked,
      snippet: nextSnippet
    };
  }

  async favorite(id: string, currentUser: AuthUser) {
    const snippet = await this.detail(id, currentUser);
    if (!snippet) {
      return {
        favorited: false,
        favoriteCount: 0,
        snippet: null
      };
    }

    const favorited = await toggleFavorite(currentUser.id, 'snippet', id);
    const nextSnippet = await this.detail(id, currentUser);
    return {
      ...favorited,
      snippet: nextSnippet
    };
  }

  async getVersions(id: string, currentUser?: AuthUser) {
    const readable = await this.detail(id, currentUser);
    if (!readable) {
      return [];
    }

    return prisma.snippetVersion.findMany({
      where: { snippetId: id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRawFile(id: string, filename: string, currentUser?: AuthUser) {
    const readable = await this.detail(id, currentUser);
    if (!readable) {
      return null;
    }

    return prisma.snippetFile.findFirst({
      where: {
        snippetId: id,
        filename
      }
    });
  }

  async toggleRecommended(id: string) {
    const snippet = await prisma.codeSnippet.findUnique({ where: { id }, select: { isRecommended: true } });
    if (!snippet) return null;
    return prisma.codeSnippet.update({
      where: { id },
      data: { isRecommended: !snippet.isRecommended },
      include: snippetDetailInclude
    });
  }

  async toggleFeatured(id: string) {
    const snippet = await prisma.codeSnippet.findUnique({ where: { id }, select: { isFeatured: true } });
    if (!snippet) return null;
    return prisma.codeSnippet.update({
      where: { id },
      data: { isFeatured: !snippet.isFeatured },
      include: snippetDetailInclude
    });
  }
}

export const snippetService = new SnippetService();
