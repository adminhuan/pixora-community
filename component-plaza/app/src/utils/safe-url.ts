const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '').trim();

const BLOCKED_PROTOCOL_PATTERN = /^(javascript|vbscript|data|file):/i;
const SAFE_DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i;

const getApiOrigin = (): string => {
  if (!API_BASE_URL) {
    return window.location.origin;
  }

  try {
    return new URL(API_BASE_URL, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

type ResolveSafeUrlOptions = {
  allowRelative?: boolean;
  allowMailTo?: boolean;
  allowTel?: boolean;
  allowHash?: boolean;
};

type ResolveSafeImageSrcOptions = {
  allowRelative?: boolean;
  allowDataImage?: boolean;
};

const decodeSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const resolveSafeRoutePath = (rawPath: string, fallback = '/'): string => {
  const value = decodeSafe(String(rawPath ?? '').trim());
  if (!value) {
    return fallback;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  if (/[\r\n]/.test(value)) {
    return fallback;
  }

  return value;
};

export const resolveSafeUrl = (url: string, options: ResolveSafeUrlOptions = {}): string => {
  const {
    allowRelative = true,
    allowMailTo = true,
    allowTel = true,
    allowHash = true
  } = options;

  const value = String(url ?? '').trim();
  if (!value) {
    return '';
  }

  if (BLOCKED_PROTOCOL_PATTERN.test(value)) {
    return '';
  }

  if (value.startsWith('/uploads/')) {
    return `${getApiOrigin()}${value}`;
  }

  if (value.startsWith('uploads/')) {
    return `${getApiOrigin()}/${value}`;
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

  if (allowHash && value.startsWith('#')) {
    return value;
  }

  if (allowRelative && (value.startsWith('/') || (!value.includes(':') && !value.startsWith('//')))) {
    return value;
  }

  return '';
};

export const resolveSafeImageSrc = (url: string, options: ResolveSafeImageSrcOptions = {}): string => {
  const {
    allowRelative = true,
    allowDataImage = true
  } = options;

  const value = String(url ?? '').trim();
  if (!value) {
    return '';
  }

  if (value.startsWith('data:')) {
    if (!allowDataImage) {
      return '';
    }

    return SAFE_DATA_IMAGE_PATTERN.test(value) ? value : '';
  }

  return resolveSafeUrl(value, {
    allowRelative,
    allowMailTo: false,
    allowTel: false,
    allowHash: false
  });
};

export const openSafeUrlInNewTab = (url: string): boolean => {
  const safeUrl = resolveSafeUrl(url, {
    allowRelative: false,
    allowMailTo: false,
    allowTel: false,
    allowHash: false
  });

  if (!safeUrl) {
    return false;
  }

  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
};
