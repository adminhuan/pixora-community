import type { ContentItem, UserBrief } from '../types/common';

const resolveAuthor = (author: unknown): UserBrief => {
  if (!author || typeof author !== 'object') {
    return { id: '', username: '匿名用户' };
  }

  const source = author as Record<string, unknown>;
  return {
    id: String(source.id ?? '').trim(),
    username: String(source.nickname ?? source.username ?? '匿名用户').trim() || '匿名用户',
    avatar: String(source.avatar ?? '').trim() || undefined
  };
};

export const mapCommentItem = (item: Record<string, unknown>): ContentItem => {
  const id = String(item.id ?? '').trim();
  const parentId = String(item.parentId ?? '').trim();
  const rootId = String(item.rootId ?? '').trim();
  const replyToId = String(item.replyToId ?? '').trim();
  const targetType = String(item.targetType ?? '').trim();
  const targetId = String(item.targetId ?? '').trim();
  const likeCount = Number(item.likeCount ?? item.likes ?? 0);
  const replyCount = Number(item.replyCount ?? 0);

  return {
    id,
    content: String(item.content ?? '').trim(),
    summary: String(item.content ?? item.contentHtml ?? '').trim(),
    createdAt: String(item.createdAt ?? ''),
    author: resolveAuthor(item.author),
    likes: Number.isFinite(likeCount) ? likeCount : 0,
    likeCount: Number.isFinite(likeCount) ? likeCount : 0,
    replyCount: Number.isFinite(replyCount) ? replyCount : 0,
    parentId: parentId || undefined,
    rootId: rootId || undefined,
    replyToId: replyToId || undefined,
    targetType: targetType || undefined,
    targetId: targetId || undefined
  };
};
