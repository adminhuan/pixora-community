import crypto from 'crypto';
import dayjs from 'dayjs';
import { marked } from 'marked';

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const sanitizeUrl = (value: string): string => {
  const trimmed = value.trim();
  const normalized = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();

  if (!normalized) {
    return '#';
  }

  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('file:')
  ) {
    return '#';
  }

  return trimmed;
};

const sanitizeRenderedHtml = (html: string): string => {
  return html.replace(/\s(href|src)=("([^"]*)"|'([^']*)')/gi, (_match, attr, _quoted, doubleQuoted, singleQuoted) => {
    const url = String(doubleQuoted ?? singleQuoted ?? '');
    const safeUrl = sanitizeUrl(url).replaceAll('"', '&quot;');
    return ` ${String(attr).toLowerCase()}="${safeUrl}"`;
  });
};

export const toObjectIdLike = (): string => {
  return crypto.randomBytes(12).toString('hex');
};

export const markdownToHtml = (markdown: string): string => {
  const safeMarkdown = escapeHtml(String(markdown ?? ''));
  const html = marked.parse(safeMarkdown, {
    gfm: true,
    breaks: true
  }) as string;

  return sanitizeRenderedHtml(html);
};

export const buildPagination = (pageRaw?: string | number, limitRaw?: string | number) => {
  const page = Math.max(Number(pageRaw) || 1, 1);
  const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const toSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const pick = <T extends object, K extends keyof T>(target: T, keys: K[]): Pick<T, K> => {
  const output = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in target) {
      output[key] = target[key];
    }
  }
  return output;
};

export const nowIso = (): string => dayjs().toISOString();
