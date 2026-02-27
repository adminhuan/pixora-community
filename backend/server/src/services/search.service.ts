import crypto from 'crypto';
import prisma from '../config/database';
import redis from '../config/redis';

interface SearchParams {
  q?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface SearchItem {
  type: string;
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  authorId?: string;
}

const clampLimit = (limit: number): number => {
  return Math.min(Math.max(limit, 1), 100);
};

const clampPage = (page: number): number => {
  return Math.min(Math.max(page, 1), 1000);
};

const normalizeKeyword = (raw: string): string => {
  return String(raw ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, 120);
};

const shouldCacheSearch = (keyword: string, page: number): boolean => {
  return keyword.length >= 2 && page <= 50;
};

class SearchService {
  private buildCacheKey(params: SearchParams): string {
    const hash = crypto
      .createHash('md5')
      .update(`${params.q ?? ''}:${params.type ?? 'all'}:${params.page ?? 1}:${params.limit ?? 20}`)
      .digest('hex');
    return `search:${hash}`;
  }

  async search(params: SearchParams) {
    const keyword = normalizeKeyword(String(params.q ?? ''));
    const type = String(params.type ?? 'all').trim();
    const page = clampPage(Number(params.page) || 1);
    const limit = clampLimit(Number(params.limit) || 20);
    const shouldCache = shouldCacheSearch(keyword, page);

    const cacheKey = this.buildCacheKey({ q: keyword, type, page, limit });
    if (shouldCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as {
          data: SearchItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        };
      }
    }

    const result =
      type === 'post'
        ? await this.searchPosts(keyword, page, limit)
        : type === 'blog'
          ? await this.searchBlogs(keyword, page, limit)
          : type === 'question'
            ? await this.searchQuestions(keyword, page, limit)
            : type === 'snippet'
              ? await this.searchSnippets(keyword, page, limit)
              : type === 'project'
                ? await this.searchProjects(keyword, page, limit)
                : type === 'tag'
                  ? await this.searchTags(keyword, page, limit)
                  : await this.searchAll(keyword, page, limit);

    if (shouldCache) {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    }
    return result;
  }

  private async searchPosts(keyword: string, page: number, limit: number) {
    const where = keyword
      ? {
          status: 'published' as const,
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { content: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : { status: 'published' as const };

    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: { id: true, title: true, content: true, createdAt: true, authorId: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.post.count({ where })
    ]);

    return {
      data: rows.map((item) => ({
        type: 'post',
        id: item.id,
        title: item.title,
        description: item.content.slice(0, 120),
        createdAt: item.createdAt,
        authorId: item.authorId
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  private async searchBlogs(keyword: string, page: number, limit: number) {
    const where = keyword
      ? {
          status: 'published' as const,
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { content: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : { status: 'published' as const };

    const [rows, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        select: { id: true, title: true, summary: true, content: true, createdAt: true, authorId: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.blog.count({ where })
    ]);

    return {
      data: rows.map((item) => ({
        type: 'blog',
        id: item.id,
        title: item.title,
        description: (item.summary ?? item.content).slice(0, 120),
        createdAt: item.createdAt,
        authorId: item.authorId
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  private async searchQuestions(keyword: string, page: number, limit: number) {
    const where = keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { content: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: { id: true, title: true, content: true, createdAt: true, authorId: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.question.count({ where })
    ]);

    return {
      data: rows.map((item) => ({
        type: 'question',
        id: item.id,
        title: item.title,
        description: item.content.slice(0, 120),
        createdAt: item.createdAt,
        authorId: item.authorId
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  private async searchSnippets(keyword: string, page: number, limit: number) {
    const where = keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { description: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.codeSnippet.findMany({
        where,
        select: { id: true, title: true, description: true, createdAt: true, authorId: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.codeSnippet.count({ where })
    ]);

    return {
      data: rows.map((item) => ({
        type: 'snippet',
        id: item.id,
        title: item.title,
        description: (item.description ?? '').slice(0, 120),
        createdAt: item.createdAt,
        authorId: item.authorId
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  private async searchProjects(keyword: string, page: number, limit: number) {
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' as const } },
            { description: { contains: keyword, mode: 'insensitive' as const } },
            { content: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: { id: true, name: true, description: true, createdAt: true, authorId: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.project.count({ where })
    ]);

    return {
      data: rows.map((item) => ({
        type: 'project',
        id: item.id,
        title: item.name,
        description: (item.description ?? '').slice(0, 120),
        createdAt: item.createdAt,
        authorId: item.authorId
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  private async searchTags(keyword: string, page: number, limit: number) {
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' as const } },
            { description: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        select: { id: true, name: true, description: true, createdAt: true },
        orderBy: { usageCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tag.count({ where })
    ]);

    return {
      data: rows.map((item) => ({
        type: 'tag',
        id: item.id,
        title: item.name,
        description: (item.description ?? '').slice(0, 120),
        createdAt: item.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  private async searchAll(keyword: string, page: number, limit: number) {
    const eachLimit = Math.min(limit, 20);
    const [posts, blogs, questions, snippets, projects, tags] = await Promise.all([
      this.searchPosts(keyword, 1, eachLimit),
      this.searchBlogs(keyword, 1, eachLimit),
      this.searchQuestions(keyword, 1, eachLimit),
      this.searchSnippets(keyword, 1, eachLimit),
      this.searchProjects(keyword, 1, eachLimit),
      this.searchTags(keyword, 1, eachLimit)
    ]);

    const merged = [
      ...posts.data,
      ...blogs.data,
      ...questions.data,
      ...snippets.data,
      ...projects.data,
      ...tags.data
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * limit;
    const data = merged.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total: merged.length,
        totalPages: Math.max(Math.ceil(merged.length / limit), 1)
      }
    };
  }

  async suggestions(keyword: string) {
    const text = normalizeKeyword(keyword);
    if (!text) {
      return [];
    }

    const [postTitles, blogTitles, questionTitles, projectNames, snippetTitles] = await Promise.all([
      prisma.post.findMany({
        where: { title: { contains: text, mode: 'insensitive' } },
        select: { title: true },
        take: 5
      }),
      prisma.blog.findMany({
        where: { title: { contains: text, mode: 'insensitive' } },
        select: { title: true },
        take: 5
      }),
      prisma.question.findMany({
        where: { title: { contains: text, mode: 'insensitive' } },
        select: { title: true },
        take: 5
      }),
      prisma.project.findMany({
        where: { name: { contains: text, mode: 'insensitive' } },
        select: { name: true },
        take: 5
      }),
      prisma.codeSnippet.findMany({
        where: { title: { contains: text, mode: 'insensitive' } },
        select: { title: true },
        take: 5
      })
    ]);

    return Array.from(
      new Set(
        [
          ...postTitles.map((item) => item.title),
          ...blogTitles.map((item) => item.title),
          ...questionTitles.map((item) => item.title),
          ...projectNames.map((item) => item.name),
          ...snippetTitles.map((item) => item.title)
        ].filter(Boolean)
      )
    ).slice(0, 10);
  }

  async hotKeywords() {
    const cacheKey = 'search:hot_keywords';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    const tags = await prisma.tag.findMany({
      orderBy: [{ usageCount: 'desc' }, { followersCount: 'desc' }],
      take: 10,
      select: {
        name: true
      }
    });

    const data = tags.map((item) => item.name);
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 600);
    return data;
  }
}

export const searchService = new SearchService();
