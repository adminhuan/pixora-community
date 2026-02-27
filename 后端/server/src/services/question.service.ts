import { AnswerStatus, Prisma, QuestionStatus, VoteContentType } from '@prisma/client';
import prisma from '../config/database';
import { buildPagination, markdownToHtml, toSlug } from '../utils/helpers';
import { AppError } from '../utils/AppError';
import { moderationService } from './moderation.service';

const questionInclude = {
  author: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true
    }
  },
  tags: {
    include: {
      tag: true
    }
  },
  acceptedAnswer: true
} satisfies Prisma.QuestionInclude;

const answerInclude = {
  author: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true
    }
  }
} satisfies Prisma.AnswerInclude;

const normalizeTagNames = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  return Array.from(new Set(tags.map((item) => String(item).trim()).filter(Boolean)));
};

const buildQuestionTagCreateInput = (tags: string[]): Prisma.QuestionTagCreateWithoutQuestionInput[] => {
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

class QuestionService {
  async list(query: { page?: string | number; limit?: string | number; status?: string; authorId?: string }) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const where: Prisma.QuestionWhereInput = {};

    if (query.status && ['open', 'closed', 'duplicate'].includes(query.status)) {
      where.status = query.status as QuestionStatus;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    const [data, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: questionInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.question.count({ where })
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
    return prisma.question.findUnique({ where: { id }, include: questionInclude });
  }

  async findById(id: string) {
    return prisma.question.findUnique({ where: { id } });
  }

  async incrementView(id: string) {
    try {
      return await prisma.question.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });
    } catch {
      return null;
    }
  }

  async createQuestion(payload: Record<string, unknown>, authorId: string) {
    const content = String(payload.content ?? '');
    const title = String(payload.title ?? '');
    const tags = normalizeTagNames(payload.tags);

    const modResult = await moderationService.moderate('question', title, content);
    if (modResult.blocked) {
      throw new AppError(modResult.blockReason ?? '内容审核未通过', {
        statusCode: 403,
        code: 'CONTENT_BLOCKED',
        details: { reason: modResult.blockReason }
      });
    }

    const status = modResult.status as QuestionStatus;

    return prisma.question.create({
      data: {
        title,
        content,
        contentHtml: markdownToHtml(content),
        status,
        author: {
          connect: { id: authorId }
        },
        tags: {
          create: buildQuestionTagCreateInput(tags)
        }
      },
      include: questionInclude
    });
  }

  async updateQuestion(id: string, payload: Record<string, unknown>) {
    const current = await prisma.question.findUnique({
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

    const data: Prisma.QuestionUpdateInput = {};
    const nextTitle = payload.title !== undefined ? String(payload.title) : current.title;
    const nextContent = payload.content !== undefined ? String(payload.content) : current.content;
    const requestedStatus =
      payload.status !== undefined && ['open', 'closed', 'duplicate', 'pending'].includes(String(payload.status))
        ? (String(payload.status) as QuestionStatus)
        : undefined;
    let finalStatus: QuestionStatus = requestedStatus ?? current.status;

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

    if (payload.tags !== undefined) {
      const tags = normalizeTagNames(payload.tags);
      data.tags = {
        deleteMany: {},
        create: buildQuestionTagCreateInput(tags)
      };
    }

    const shouldModerate =
      finalStatus === 'open' &&
      (payload.title !== undefined || payload.content !== undefined || payload.status !== undefined);
    if (shouldModerate) {
      const modResult = await moderationService.moderate('question', nextTitle, nextContent);
      if (modResult.blocked) {
        throw new AppError(modResult.blockReason ?? '内容审核未通过', {
          statusCode: 403,
          code: 'CONTENT_BLOCKED',
          details: { reason: modResult.blockReason }
        });
      }

      finalStatus = modResult.status as QuestionStatus;
      data.status = finalStatus;
    }

    try {
      return await prisma.question.update({
        where: { id },
        data,
        include: questionInclude
      });
    } catch {
      return null;
    }
  }

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({ where: { id }, select: { id: true } });
      if (!question) {
        return false;
      }

      await tx.answer.deleteMany({ where: { questionId: id } });
      await tx.question.delete({ where: { id } });
      return true;
    });
  }

  async findSimilar(keyword: string) {
    const target = keyword.trim();
    if (!target) {
      return [];
    }

    return prisma.question.findMany({
      where: {
        OR: [
          { title: { contains: target, mode: 'insensitive' } },
          { content: { contains: target, mode: 'insensitive' } }
        ]
      },
      include: questionInclude,
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  async voteQuestion(id: string, userId: string, value: 1 | -1) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({ where: { id } });
      if (!question) {
        throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
      }

      const existing = await tx.vote.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: VoteContentType.question,
            targetId: id
          }
        }
      });

      let delta: number = value;
      if (existing) {
        if (existing.value === value) {
          delta = 0;
        } else {
          delta = value - existing.value;
          await tx.vote.update({ where: { id: existing.id }, data: { value } });
        }
      } else {
        await tx.vote.create({
          data: {
            userId,
            targetType: VoteContentType.question,
            targetId: id,
            value
          }
        });
      }

      return tx.question.update({
        where: { id },
        data: {
          voteCount: {
            increment: delta
          }
        },
        include: questionInclude
      });
    });
  }

  async followQuestion(id: string, _userId: string) {
    const exists = await prisma.question.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
    }

    return {
      questionId: id,
      followed: true
    };
  }

  async listAnswers(questionId: string, currentUserId?: string, isAdmin = false) {
    const where: Prisma.AnswerWhereInput = { questionId };

    // Non-admins can only see active answers + their own pending ones
    if (!isAdmin) {
      if (currentUserId) {
        where.OR = [
          { status: 'active' },
          { status: 'pending', authorId: currentUserId }
        ];
      } else {
        where.status = 'active';
      }
    }

    return prisma.answer.findMany({
      where,
      include: answerInclude,
      orderBy: [
        {
          isAccepted: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    });
  }

  async createAnswer(questionId: string, userId: string, content: string) {
    const modResult = await moderationService.moderate('answer', null, content);
    if (modResult.blocked) {
      throw new AppError(modResult.blockReason ?? '内容审核未通过', {
        statusCode: 403,
        code: 'CONTENT_BLOCKED',
        details: { reason: modResult.blockReason }
      });
    }

    const answerStatus = modResult.status as AnswerStatus;
    const isPending = answerStatus === 'pending';

    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({ where: { id: questionId } });
      if (!question) {
        throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
      }

      const answer = await tx.answer.create({
        data: {
          question: {
            connect: {
              id: questionId
            }
          },
          author: {
            connect: {
              id: userId
            }
          },
          content,
          contentHtml: markdownToHtml(content),
          status: answerStatus
        },
        include: answerInclude
      });

      // Only increment count and award points when not pending
      if (!isPending) {
        await tx.question.update({
          where: { id: questionId },
          data: {
            answerCount: {
              increment: 1
            }
          }
        });

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user) {
          const balance = user.points + 10;
          await tx.user.update({
            where: { id: userId },
            data: {
              points: balance
            }
          });
          await tx.pointsLog.create({
            data: {
              userId,
              type: 'earn',
              action: 'answer',
              points: 10,
              balance,
              description: '提交回答奖励'
            }
          });
        }
      }

      return answer;
    });
  }

  async getAnswerById(id: string) {
    return prisma.answer.findUnique({ where: { id }, include: answerInclude });
  }

  async updateAnswer(id: string, content: string) {
    try {
      return await prisma.answer.update({
        where: { id },
        data: {
          content,
          contentHtml: markdownToHtml(content)
        },
        include: answerInclude
      });
    } catch {
      return null;
    }
  }

  async deleteAnswer(id: string) {
    return prisma.$transaction(async (tx) => {
      const answer = await tx.answer.findUnique({ where: { id } });
      if (!answer) {
        return false;
      }

      await tx.answer.delete({ where: { id } });
      await tx.question.update({
        where: { id: answer.questionId },
        data: {
          answerCount: {
            decrement: 1
          }
        }
      });
      return true;
    });
  }

  async voteAnswer(id: string, userId: string, value: 1 | -1) {
    return prisma.$transaction(async (tx) => {
      const answer = await tx.answer.findUnique({ where: { id } });
      if (!answer) {
        throw new AppError('回答不存在', { statusCode: 404, code: 'ANSWER_NOT_FOUND' });
      }

      const existing = await tx.vote.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: VoteContentType.answer,
            targetId: id
          }
        }
      });

      let delta: number = value;
      if (existing) {
        if (existing.value === value) {
          delta = 0;
        } else {
          delta = value - existing.value;
          await tx.vote.update({ where: { id: existing.id }, data: { value } });
        }
      } else {
        await tx.vote.create({
          data: {
            userId,
            targetType: VoteContentType.answer,
            targetId: id,
            value
          }
        });
      }

      return tx.answer.update({
        where: { id },
        data: {
          voteCount: {
            increment: delta
          }
        },
        include: answerInclude
      });
    });
  }

  async acceptAnswer(id: string, operatorId: string) {
    return prisma.$transaction(async (tx) => {
      const answer = await tx.answer.findUnique({ where: { id } });
      if (!answer) {
        throw new AppError('回答不存在', { statusCode: 404, code: 'ANSWER_NOT_FOUND' });
      }

      const question = await tx.question.findUnique({ where: { id: answer.questionId } });
      if (!question) {
        throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
      }

      if (question.authorId !== operatorId) {
        throw new AppError('仅提问者可采纳', { statusCode: 403, code: 'FORBIDDEN' });
      }

      if (question.acceptedAnswerId && question.acceptedAnswerId !== id) {
        await tx.answer.update({
          where: {
            id: question.acceptedAnswerId
          },
          data: {
            isAccepted: false
          }
        });
      }

      await tx.answer.update({
        where: { id },
        data: {
          isAccepted: true
        }
      });

      await tx.question.update({
        where: { id: question.id },
        data: {
          acceptedAnswerId: id,
          isSolved: true
        }
      });

      const answerUser = await tx.user.findUnique({ where: { id: answer.authorId } });
      if (answerUser) {
        const balance = answerUser.points + 50;
        await tx.user.update({
          where: { id: answer.authorId },
          data: {
            points: balance
          }
        });

        await tx.pointsLog.create({
          data: {
            userId: answer.authorId,
            type: 'earn',
            action: 'answer_accepted',
            points: 50,
            balance,
            description: `回答 ${id} 被采纳`
          }
        });
      }

      return {
        acceptedAnswerId: id,
        questionId: question.id
      };
    });
  }
}

export const questionService = new QuestionService();
