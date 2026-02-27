export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sort?: string;
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Option {
  label: string;
  value: string;
}

export interface UserBrief {
  id: string;
  username: string;
  avatar?: string;
  level?: string;
}

export interface ContentItem {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  category?: string;
  status?: string;
  coverImage?: string;
  href?: string;
  author?: UserBrief;
  createdAt?: string;
  updatedAt?: string;
  likes?: number;
  likeCount?: number;
  favorites?: number;
  views?: number;
  replyCount?: number;
  parentId?: string;
  rootId?: string;
  replyToId?: string;
  targetType?: string;
  targetId?: string;
}
