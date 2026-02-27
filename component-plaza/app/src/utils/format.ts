import dayjs from 'dayjs';

export const formatDate = (value?: string | Date, pattern = 'YYYY-MM-DD HH:mm') => {
  if (!value) {
    return '--';
  }
  return dayjs(value).format(pattern);
};

export const formatNumber = (value?: number) => {
  if (value === undefined || value === null) {
    return '0';
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
};

export const relativeTime = (value?: string | Date) => {
  if (!value) {
    return '--';
  }
  const now = dayjs();
  const target = dayjs(value);
  const diffMinutes = now.diff(target, 'minute');
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours} 小时前`;
  const diffDays = now.diff(target, 'day');
  if (diffDays < 7) return `${diffDays} 天前`;
  return target.format('YYYY-MM-DD');
};
