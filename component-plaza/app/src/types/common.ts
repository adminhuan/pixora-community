export interface PaginationParams {
  page?: number;
  limit?: number;
  keyword?: string;
  sort?: string;
  [key: string]: unknown;
}

export interface UserBrief {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
}

export interface SnippetFile {
  id: string;
  filename: string;
  language: string;
  content: string;
  snippetId: string;
}

export interface SnippetTag {
  snippetId: string;
  tagId: string;
  tag: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  author: UserBrief;
  visibility: 'public' | 'private';
  type: string;
  category?: string;
  framework: string;
  likeCount: number;
  forkCount: number;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;
  isRecommended: boolean;
  isFeatured: boolean;
  forkedFromId?: string;
  files: SnippetFile[];
  tags: SnippetTag[];
  isLiked?: boolean;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
}
