import { Request } from 'express';

const UNKNOWN_VALUES = new Set(['', 'unknown', 'null', 'undefined']);

const normalizeCandidate = (value: string): string => {
  const trimmed = String(value ?? '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .toLowerCase();

  if (UNKNOWN_VALUES.has(trimmed)) {
    return '';
  }

  let normalized = trimmed;

  if (normalized.startsWith('[') && normalized.includes(']')) {
    normalized = normalized.slice(1, normalized.indexOf(']'));
  } else if (/^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(normalized)) {
    normalized = normalized.slice(0, normalized.lastIndexOf(':'));
  }

  if (normalized === '::1') {
    return '127.0.0.1';
  }

  if (normalized.startsWith('::ffff:')) {
    return normalized.slice(7);
  }

  return normalized;
};

const pickFromHeader = (value: string | string[] | undefined): string => {
  if (!value) {
    return '';
  }

  const joined = Array.isArray(value) ? value.join(',') : value;
  const candidates = joined
    .split(',')
    .map((item) => normalizeCandidate(item))
    .filter(Boolean);

  return candidates[0] ?? '';
};

export const getClientIp = (req: Request): string => {
  const headerCandidates = [
    pickFromHeader(req.headers['cf-connecting-ip']),
    pickFromHeader(req.headers['x-forwarded-for']),
    pickFromHeader(req.headers['x-real-ip']),
    pickFromHeader(req.headers['x-client-ip']),
    pickFromHeader(req.headers['x-original-forwarded-for'])
  ];

  for (const candidate of headerCandidates) {
    if (candidate) {
      return candidate;
    }
  }

  const fallbackCandidates = [normalizeCandidate(String(req.ip ?? '')), normalizeCandidate(String(req.socket?.remoteAddress ?? ''))];

  return fallbackCandidates.find(Boolean) ?? '';
};
