const getServerOrigin = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';

  try {
    return new URL(base).origin;
  } catch {
    return '';
  }
};

type ResolveSafeUrlOptions = {
  allowRelative?: boolean;
  allowMailTo?: boolean;
  allowTel?: boolean;
};

const blockedProtocolPattern = /^(javascript|vbscript|data|file):/i;

export const resolveSafeUrl = (url: string, options: ResolveSafeUrlOptions = {}): string => {
  const {
    allowRelative = true,
    allowMailTo = true,
    allowTel = true
  } = options;

  const value = String(url ?? '').trim();
  if (!value) {
    return '';
  }

  if (blockedProtocolPattern.test(value)) {
    return '';
  }

  if (value.startsWith('/uploads/')) {
    const origin = getServerOrigin();
    return origin ? `${origin}${value}` : '';
  }

  if (value.startsWith('uploads/')) {
    const origin = getServerOrigin();
    return origin ? `${origin}/${value}` : '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (allowMailTo && /^mailto:/i.test(value)) {
    return value;
  }

  if (allowTel && /^tel:/i.test(value)) {
    return value;
  }

  if (allowRelative && value.startsWith('/')) {
    return value;
  }

  return '';
};
