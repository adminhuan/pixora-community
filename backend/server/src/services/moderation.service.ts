import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { sensitiveWordService } from './sensitiveWord.service';
import { logger } from '../utils/logger';

export interface ModerationResult {
  allowed: boolean;
  status: string;
  blocked: boolean;
  blockReason?: string;
}

interface ModerationConfig {
  preReviewEnabled: boolean;
  preReviewTypes: string[];
  aiEnabled: boolean;
  aiEndpoint: string;
  aiAuthToken: string;
  aiModel: string;
  aiTimeoutMs: number;
}

interface AiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const DEFAULT_CONFIG: ModerationConfig = {
  preReviewEnabled: false,
  preReviewTypes: [],
  aiEnabled: false,
  aiEndpoint: '',
  aiAuthToken: '',
  aiModel: 'openclaw:main',
  aiTimeoutMs: 300000
};

const STATUS_MAP: Record<string, { published: string; pending: string }> = {
  post: { published: 'published', pending: 'pending' },
  blog: { published: 'published', pending: 'pending' },
  question: { published: 'open', pending: 'pending' },
  comment: { published: 'active', pending: 'pending' },
  answer: { published: 'active', pending: 'pending' }
};

class ModerationService {
  private async getConfig(): Promise<ModerationConfig> {
    const record = await prisma.systemSetting.findUnique({
      where: { group: 'content_moderation' }
    });

    if (!record || !record.payload || typeof record.payload !== 'object' || Array.isArray(record.payload)) {
      return { ...DEFAULT_CONFIG };
    }

    const payload = record.payload as Record<string, unknown>;
    return {
      preReviewEnabled: Boolean(payload.preReviewEnabled),
      preReviewTypes: Array.isArray(payload.preReviewTypes) ? payload.preReviewTypes.map(String) : [],
      aiEnabled: Boolean(payload.aiEnabled),
      aiEndpoint: String(payload.aiEndpoint ?? DEFAULT_CONFIG.aiEndpoint),
      aiAuthToken: String(payload.aiAuthToken ?? ''),
      aiModel: String(payload.aiModel ?? DEFAULT_CONFIG.aiModel),
      aiTimeoutMs: Number(payload.aiTimeoutMs) || DEFAULT_CONFIG.aiTimeoutMs
    };
  }

  async moderate(contentType: string, title: string | undefined | null, content: string): Promise<ModerationResult> {
    const publishedStatus = STATUS_MAP[contentType]?.published ?? 'published';
    const pendingStatus = STATUS_MAP[contentType]?.pending ?? 'pending';

    // Layer 1: Sensitive word check
    const wordResult = sensitiveWordService.checkFields(title, content);
    if (wordResult.hit) {
      return {
        allowed: false,
        status: publishedStatus,
        blocked: true,
        blockReason: `内容包含敏感词：${wordResult.word}`
      };
    }

    const config = await this.getConfig();

    // Layer 2: AI moderation
    if (config.aiEnabled && config.aiEndpoint) {
      const aiResult = await this.callAI(config, title, content);

      if (aiResult.decision === 'reject') {
        return {
          allowed: false,
          status: publishedStatus,
          blocked: true,
          blockReason: aiResult.reason || 'AI 审核未通过'
        };
      }

      if (aiResult.decision === 'flag') {
        return {
          allowed: true,
          status: pendingStatus,
          blocked: false
        };
      }
    }

    // Layer 3: Pre-review config
    if (config.preReviewEnabled && config.preReviewTypes.includes(contentType)) {
      return {
        allowed: true,
        status: pendingStatus,
        blocked: false
      };
    }

    // All passed
    return {
      allowed: true,
      status: publishedStatus,
      blocked: false
    };
  }

  private async callAI(
    config: ModerationConfig,
    title: string | undefined | null,
    content: string
  ): Promise<{ decision: 'pass' | 'reject' | 'flag'; reason?: string }> {
    const userContent = title ? `标题：${title}\n内容：${content}` : content;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs);

      const response = await fetch(config.aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.aiAuthToken ? { Authorization: `Bearer ${config.aiAuthToken}` } : {})
        },
        body: JSON.stringify({
          model: config.aiModel,
          messages: [
            {
              role: 'system',
              content: '你是社区内容审核助手。判断内容是否违规（色情/暴力/政治敏感/广告/侮辱）。以JSON回复：{"decision": "pass"|"reject"|"flag", "reason": "原因"}'
            },
            {
              role: 'user',
              content: userContent
            }
          ],
          temperature: 0
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn('AI 审核接口返回非 200', { status: response.status });
        return { decision: 'flag', reason: 'AI 审核服务异常，转人工审核' };
      }

      const data = (await response.json()) as AiChatCompletionResponse;
      const messageContent = String(data.choices?.[0]?.message?.content ?? '');

      const jsonMatch = messageContent.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        logger.warn('AI 审核返回格式异常', { content: messageContent });
        return { decision: 'flag', reason: 'AI 返回格式异常，转人工审核' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const decision = String(parsed.decision ?? '').trim();
      const reason = String(parsed.reason ?? '').trim();

      if (decision === 'pass' || decision === 'reject' || decision === 'flag') {
        return { decision, reason };
      }

      return { decision: 'flag', reason: 'AI 返回结果无法解析，转人工审核' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      logger.warn('AI 审核调用失败，降级为人工审核', { error: message });
      return { decision: 'flag', reason: 'AI 审核调用失败，转人工审核' };
    }
  }

  async testAI(config: Partial<ModerationConfig>): Promise<{ ok: boolean; message: string; response?: unknown }> {
    const endpoint = String(config.aiEndpoint ?? DEFAULT_CONFIG.aiEndpoint);
    const authToken = String(config.aiAuthToken ?? '');
    const model = String(config.aiModel ?? DEFAULT_CONFIG.aiModel);
    const timeoutMs = Number(config.aiTimeoutMs) || DEFAULT_CONFIG.aiTimeoutMs;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: '你是社区内容审核助手。判断内容是否违规（色情/暴力/政治敏感/广告/侮辱）。以JSON回复：{"decision": "pass"|"reject"|"flag", "reason": "原因"}'
            },
            {
              role: 'user',
              content: '测试内容：这是一条测试消息，用于验证 AI 审核连接。'
            }
          ],
          temperature: 0
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return { ok: false, message: `AI 服务返回 HTTP ${response.status}` };
      }

      const data = (await response.json()) as AiChatCompletionResponse;
      const messageContent = String(data.choices?.[0]?.message?.content ?? '');

      return {
        ok: true,
        message: 'AI 审核连接成功',
        response: { content: messageContent }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      return { ok: false, message: `AI 审核连接失败：${message}` };
    }
  }

  async logAudit(params: {
    contentType: string;
    contentId: string;
    authorId?: string;
    action: string;
    reason?: string;
    operatorId?: string;
    aiResponse?: unknown;
  }) {
    await prisma.contentAuditLog.create({
      data: {
        contentType: params.contentType,
        contentId: params.contentId,
        authorId: params.authorId,
        action: params.action,
        reason: params.reason,
        operatorId: params.operatorId,
        aiResponse: params.aiResponse ? (params.aiResponse as Prisma.InputJsonValue) : undefined
      }
    });
  }
}

export const moderationService = new ModerationService();
