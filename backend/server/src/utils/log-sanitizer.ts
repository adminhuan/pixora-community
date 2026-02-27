const REDACTED = '[REDACTED]';
const MAX_DEPTH = 4;
const MAX_ARRAY_LENGTH = 20;
const MAX_STRING_LENGTH = 320;

const sensitiveKeyPattern =
  /(authorization|password|pass|token|secret|cookie|session|credential|api[-_]?key|captcha|code)/i;
const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
const longSecretPattern = /^[A-Za-z0-9+/=._-]{24,}$/;

const sanitizeString = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (/^Bearer\s+/i.test(trimmed)) {
    return 'Bearer [REDACTED]';
  }

  if (jwtPattern.test(trimmed)) {
    return '[JWT_REDACTED]';
  }

  if (longSecretPattern.test(trimmed)) {
    return `${trimmed.slice(0, 6)}...[MASKED]`;
  }

  if (trimmed.length > MAX_STRING_LENGTH) {
    return `${trimmed.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
  }

  return trimmed;
};

const sanitizeObject = (value: Record<string, unknown>, depth: number): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (sensitiveKeyPattern.test(key)) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = sanitizeForLog(item, depth + 1);
  }

  return result;
};

export const sanitizeForLog = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeForLog(item, depth + 1));
  }

  if (value instanceof Error) {
    return sanitizeObject(
      {
        name: value.name,
        message: value.message,
        stack: value.stack
      },
      depth
    );
  }

  if (typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>, depth);
  }

  return String(value);
};
