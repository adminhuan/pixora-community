# 模块17：数据库重构 - PostgreSQL + Redis 迁移

> 重要：这是一个全新任务，不是对之前模块01/02的修改。当前代码使用单表JSON存储（DynamicRecord），必须重构为完整的 PostgreSQL 关系型模型 + Redis 缓存。

## 任务背景

当前后端代码存在严重的数据库架构问题：
- `prisma/schema.prisma` 只有一个 `DynamicRecord` 模型，所有数据存在 `payload Json` 字段里
- `src/constants/inmemory-db.ts` 包含 `InMemoryModel` 类，所有 Service 层使用内存存储
- `src/models/*.model.ts` 全部20个文件内容都是 `export {};`，没有任何实际定义
- 完全丧失了关系型数据库的索引、约束、外键、枚举等优势

## 任务目标

1. 重写 `prisma/schema.prisma`，定义所有独立模型
2. 配置 Redis 连接（ioredis）
3. 重写所有 Service 层代码，从 InMemoryModel 改为 Prisma Client 调用
4. 删除 `DynamicRecord` 模型和 `InMemoryModel` 类

## 一、Prisma Schema 重写

### 文件：`prisma/schema.prisma`

删除现有的 `DynamicRecord` 模型，替换为以下完整的 Schema 定义：

### 枚举类型定义
```prisma
enum UserRole {
  user
  moderator
  admin
}

enum UserStatus {
  active
  muted
  banned
}

enum PostStatus {
  draft
  published
  deleted
  pending
}

enum QuestionStatus {
  open
  closed
  duplicate
}

enum ProjectStatus {
  developing
  completed
  maintained
  deprecated
}

enum BlogStatus {
  draft
  published
  deleted
}

enum CommentStatus {
  active
  deleted
  hidden
}

enum ContentType {
  post
  blog
  project
  snippet
  question
  answer
}

enum VoteContentType {
  question
  answer
}

enum NotificationType {
  comment
  reply
  like
  follow
  answer
  accept
  system
}

enum ReportReason {
  spam
  abuse
  inappropriate
  copyright
  other
}

enum ReportStatus {
  pending
  resolved
  rejected
}

enum PointsType {
  earn
  spend
}

enum CategoryType {
  post
  blog
  project
}

enum SnippetVisibility {
  public
  private
}
```

### 模型定义

#### 1. User
```prisma
model User {
  id               String    @id @default(cuid())
  username         String    @unique
  email            String    @unique
  phone            String?
  password         String
  avatar           String?
  coverImage       String?
  nickname         String?
  bio              String?
  signature        String?
  role             UserRole  @default(user)
  status           UserStatus @default(active)
  mutedUntil       DateTime?
  bannedUntil      DateTime?
  position         String?
  company          String?
  city             String?
  website          String?
  github           String?
  points           Int       @default(0)
  level            Int       @default(1)
  followersCount   Int       @default(0)
  followingCount   Int       @default(0)
  postsCount       Int       @default(0)
  notificationSettings Json?
  lastLoginAt      DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // 关联
  oauthProviders   OAuthProvider[]
  posts            Post[]
  blogs            Blog[]
  projects         Project[]
  snippets         CodeSnippet[]
  questions        Question[]
  answers          Answer[]
  comments         Comment[]
  likes            Like[]
  favorites        Favorite[]
  favoriteFolders  FavoriteFolder[]
  votes            Vote[]
  following        Follow[]    @relation("follower")
  followers        Follow[]    @relation("following")
  series           Series[]
  pointsLogs       PointsLog[]
  achievements     UserAchievement[]
  notifications    Notification[] @relation("recipient")
  sentNotifications Notification[] @relation("sender")
  reports          Report[]    @relation("reporter")
  reportedAgainst  Report[]    @relation("targetAuthor")
  handledReports   Report[]    @relation("handler")

  @@index([status])
  @@index([createdAt])
}

model OAuthProvider {
  id         String @id @default(cuid())
  provider   String
  providerId String
  userId     String
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
}
```

#### 2. Post
```prisma
model Post {
  id            String     @id @default(cuid())
  title         String
  content       String
  contentHtml   String?
  authorId      String
  author        User       @relation(fields: [authorId], references: [id])
  categoryId    String?
  category      Category?  @relation(fields: [categoryId], references: [id])
  status        PostStatus @default(draft)
  isPinned      Boolean    @default(false)
  isFeatured    Boolean    @default(false)
  isLocked      Boolean    @default(false)
  viewCount     Int        @default(0)
  likeCount     Int        @default(0)
  favoriteCount Int        @default(0)
  commentCount  Int        @default(0)
  lastCommentAt DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  tags          PostTag[]

  @@index([authorId])
  @@index([categoryId])
  @@index([status])
  @@index([isPinned])
  @@index([createdAt])
  @@index([likeCount])
}

model PostTag {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}
```

#### 3. CodeSnippet
```prisma
model CodeSnippet {
  id            String            @id @default(cuid())
  title         String
  description   String?
  authorId      String
  author        User              @relation(fields: [authorId], references: [id])
  visibility    SnippetVisibility @default(public)
  likeCount     Int               @default(0)
  forkCount     Int               @default(0)
  favoriteCount Int               @default(0)
  commentCount  Int               @default(0)
  forkedFromId  String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  files         SnippetFile[]
  versions      SnippetVersion[]
  tags          SnippetTag[]

  @@index([authorId])
  @@index([visibility])
  @@index([createdAt])
}

model SnippetFile {
  id        String      @id @default(cuid())
  filename  String
  language  String
  content   String
  snippetId String
  snippet   CodeSnippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)

  @@index([snippetId])
}

model SnippetVersion {
  id        String      @id @default(cuid())
  message   String?
  files     Json
  snippetId String
  snippet   CodeSnippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())

  @@index([snippetId])
}

model SnippetTag {
  snippetId String
  tagId     String
  snippet   CodeSnippet @relation(fields: [snippetId], references: [id], onDelete: Cascade)
  tag       Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([snippetId, tagId])
}
```

#### 4. Question
```prisma
model Question {
  id               String         @id @default(cuid())
  title            String
  content          String
  contentHtml      String?
  authorId         String
  author           User           @relation(fields: [authorId], references: [id])
  status           QuestionStatus @default(open)
  isSolved         Boolean        @default(false)
  acceptedAnswerId String?        @unique
  acceptedAnswer   Answer?        @relation("acceptedAnswer", fields: [acceptedAnswerId], references: [id])
  bounty           Int            @default(0)
  bountyExpiresAt  DateTime?
  viewCount        Int            @default(0)
  voteCount        Int            @default(0)
  answerCount      Int            @default(0)
  duplicateOfId    String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  answers          Answer[]       @relation("questionAnswers")
  tags             QuestionTag[]

  @@index([authorId])
  @@index([status])
  @@index([isSolved])
  @@index([bounty])
  @@index([createdAt])
  @@index([voteCount])
}

model QuestionTag {
  questionId String
  tagId      String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([questionId, tagId])
}
```

#### 5. Answer
```prisma
model Answer {
  id            String   @id @default(cuid())
  content       String
  contentHtml   String?
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])
  questionId    String
  question      Question @relation("questionAnswers", fields: [questionId], references: [id])
  isAccepted    Boolean  @default(false)
  voteCount     Int      @default(0)
  commentCount  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  acceptedFor   Question? @relation("acceptedAnswer")

  @@index([questionId])
  @@index([authorId])
  @@index([isAccepted])
  @@index([voteCount])
  @@index([createdAt])
}
```

#### 6. Project
```prisma
model Project {
  id            String        @id @default(cuid())
  name          String
  description   String?
  content       String?
  contentHtml   String?
  coverImage    String?
  screenshots   String[]
  authorId      String
  author        User          @relation(fields: [authorId], references: [id])
  categoryId    String?
  category      Category?     @relation(fields: [categoryId], references: [id])
  techStack     String[]
  demoUrl       String?
  sourceUrl     String?
  status        ProjectStatus @default(developing)
  likeCount     Int           @default(0)
  favoriteCount Int           @default(0)
  commentCount  Int           @default(0)
  ratingAvg     Float         @default(0)
  ratingCount   Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([authorId])
  @@index([categoryId])
  @@index([status])
  @@index([ratingAvg])
  @@index([createdAt])
}
```

#### 7. Blog
```prisma
model Blog {
  id            String     @id @default(cuid())
  title         String
  content       String
  contentHtml   String?
  summary       String?
  coverImage    String?
  authorId      String
  author        User       @relation(fields: [authorId], references: [id])
  categoryId    String?
  category      Category?  @relation(fields: [categoryId], references: [id])
  seriesId      String?
  series        Series?    @relation(fields: [seriesId], references: [id])
  seriesOrder   Int?
  status        BlogStatus @default(draft)
  isRecommended Boolean    @default(false)
  isBanner      Boolean    @default(false)
  viewCount     Int        @default(0)
  likeCount     Int        @default(0)
  favoriteCount Int        @default(0)
  commentCount  Int        @default(0)
  readingTime   Int?
  publishedAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  tags          BlogTag[]

  @@index([authorId])
  @@index([categoryId])
  @@index([seriesId])
  @@index([status])
  @@index([isRecommended])
  @@index([publishedAt])
}

model BlogTag {
  blogId String
  tagId  String
  blog   Blog @relation(fields: [blogId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([blogId, tagId])
}
```

#### 8. Comment
```prisma
model Comment {
  id          String        @id @default(cuid())
  content     String
  contentHtml String?
  authorId    String
  author      User          @relation(fields: [authorId], references: [id])
  targetType  ContentType
  targetId    String
  parentId    String?
  rootId      String?
  replyToId   String?
  likeCount   Int           @default(0)
  replyCount  Int           @default(0)
  isPinned    Boolean       @default(false)
  status      CommentStatus @default(active)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([targetType, targetId])
  @@index([authorId])
  @@index([parentId])
  @@index([rootId])
  @@index([createdAt])
}
```

#### 9. Tag
```prisma
model Tag {
  id             String   @id @default(cuid())
  name           String   @unique
  slug           String   @unique
  description    String?
  icon           String?
  aliases        String[]
  usageCount     Int      @default(0)
  followersCount Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  posts          PostTag[]
  blogs          BlogTag[]
  snippets       SnippetTag[]
  questions      QuestionTag[]

  @@index([usageCount])
}
```

#### 10. Category
```prisma
model Category {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  description String?
  icon        String?
  parentId    String?
  order       Int          @default(0)
  type        CategoryType
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  posts       Post[]
  blogs       Blog[]
  projects    Project[]

  @@index([parentId])
  @@index([type])
  @@index([order])
  @@index([isActive])
}
```

#### 11. Notification
```prisma
model Notification {
  id          String           @id @default(cuid())
  recipientId String
  recipient   User             @relation("recipient", fields: [recipientId], references: [id])
  senderId    String?
  sender      User?            @relation("sender", fields: [senderId], references: [id])
  type        NotificationType
  targetType  String?
  targetId    String?
  content     String?
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())

  @@index([recipientId, isRead])
  @@index([type])
  @@index([createdAt])
}
```

#### 12. 关系模型

```prisma
model Like {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  targetType ContentType
  targetId   String
  createdAt  DateTime    @default(now())

  @@unique([userId, targetType, targetId])
}

model Favorite {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  targetType ContentType
  targetId   String
  folderId   String?
  folder     FavoriteFolder? @relation(fields: [folderId], references: [id])
  createdAt  DateTime    @default(now())

  @@unique([userId, targetType, targetId])
}

model FavoriteFolder {
  id        String     @id @default(cuid())
  name      String
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  favorites Favorite[]

  @@index([userId])
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("follower", fields: [followerId], references: [id])
  followingId String
  following   User     @relation("following", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}

model Vote {
  id         String          @id @default(cuid())
  userId     String
  user       User            @relation(fields: [userId], references: [id])
  targetType VoteContentType
  targetId   String
  value      Int
  createdAt  DateTime        @default(now())

  @@unique([userId, targetType, targetId])
}

model Report {
  id             String       @id @default(cuid())
  reporterId     String
  reporter       User         @relation("reporter", fields: [reporterId], references: [id])
  targetType     String
  targetId       String
  targetAuthorId String?
  targetAuthor   User?        @relation("targetAuthor", fields: [targetAuthorId], references: [id])
  reason         ReportReason
  description    String?
  status         ReportStatus @default(pending)
  handledById    String?
  handledBy      User?        @relation("handler", fields: [handledById], references: [id])
  handleResult   String?
  handledAt      DateTime?
  createdAt      DateTime     @default(now())

  @@index([status])
  @@index([reporterId])
  @@index([targetAuthorId])
  @@index([createdAt])
}
```

#### 13. 其他模型

```prisma
model Series {
  id             String   @id @default(cuid())
  name           String
  description    String?
  coverImage     String?
  authorId       String
  author         User     @relation(fields: [authorId], references: [id])
  articleCount   Int      @default(0)
  followersCount Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  blogs          Blog[]

  @@index([authorId])
}

model PointsLog {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  type        PointsType
  action      String
  points      Int
  balance     Int
  description String?
  createdAt   DateTime   @default(now())

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

model Achievement {
  id             String            @id @default(cuid())
  name           String            @unique
  description    String?
  icon           String?
  condition      String?
  conditionType  String?
  conditionValue Int?

  users          UserAchievement[]
}

model UserAchievement {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  unlockedAt    DateTime    @default(now())

  @@unique([userId, achievementId])
}
```

## 二、Redis 配置

### 文件：`src/config/redis.ts`

```typescript
import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err: Error) => {
  logger.error('Redis error', { message: err.message });
});

export default redis;
```

### 文件：`src/config/index.ts` 中添加 Redis 配置

```typescript
redis: {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
}
```

### `.env.example` 中添加

```
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## 三、Prisma Client 初始化

### 文件：`src/config/database.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Prisma Query', { query: e.query, duration: e.duration });
  }
});

export default prisma;
```

## 四、Service 层重写要求

所有 Service 文件必须从 InMemoryModel 调用改为 Prisma Client 调用。

### 重写模式示例

**之前（错误的）：**
```typescript
import { InMemoryModel } from '../constants/inmemory-db';
const postModel = new InMemoryModel('post');

async function findAll() {
  return postModel.find({});
}
```

**之后（正确的）：**
```typescript
import prisma from '../config/database';

async function findAll(params: { page: number; limit: number; status?: string }) {
  const { page, limit, status } = params;
  const where = status ? { status: status as PostStatus } : {};

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: { id: true, username: true, avatar: true, nickname: true } }, category: true, tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

### 需要重写的 Service 文件清单

| 文件 | 改为使用 |
|------|----------|
| `src/services/auth.service.ts` | `prisma.user` |
| `src/services/post.service.ts` | `prisma.post`、`prisma.postTag` |
| `src/services/blog.service.ts` | `prisma.blog`、`prisma.blogTag` |
| `src/services/snippet.service.ts` | `prisma.codeSnippet`、`prisma.snippetFile` |
| `src/services/question.service.ts` | `prisma.question`、`prisma.questionTag` |
| `src/services/answer.service.ts` | `prisma.answer` |
| `src/services/project.service.ts` | `prisma.project` |
| `src/services/comment.service.ts` | `prisma.comment` |
| `src/services/follow.service.ts` | `prisma.follow` |
| `src/services/search.service.ts` | 使用 Prisma 的 `contains` + `mode: 'insensitive'` |
| `src/services/notification.service.ts` | `prisma.notification` |
| `src/services/tag.service.ts` | `prisma.tag` |
| `src/services/user.service.ts` | `prisma.user` |
| `src/services/admin/*.service.ts` | 全部改为 Prisma 调用 |

## 五、需要删除的文件

- `src/constants/inmemory-db.ts` - 删除整个文件
- `src/models/*.model.ts` - 删除所有空模型文件（Prisma 自动生成类型）

## 六、依赖更新

### 需要安装的依赖
```bash
npm install @prisma/client ioredis
npm install -D prisma
```

### 需要移除的依赖（如果存在）
```bash
npm uninstall mongoose
```

### 初始化 Prisma 迁移
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 七、Redis 使用场景

在完成 Prisma 迁移后，Redis 用于以下场景：

| 场景 | Key 格式 | 过期时间 |
|------|----------|----------|
| 验证码存储 | `captcha:{captchaId}` | 5分钟 |
| 密码重置令牌 | `reset:{token}` | 15分钟 |
| 短信验证码 | `sms:{phone}` | 5分钟 |
| 邮箱验证码 | `email_verify:{email}` | 30分钟 |
| 用户会话缓存 | `session:{userId}` | 7天 |
| 搜索结果缓存 | `search:{hash}` | 5分钟 |
| 热门标签缓存 | `hot_tags` | 10分钟 |
| 排行榜缓存 | `ranking:{type}` | 30分钟 |
| 限流计数 | `ratelimit:{ip}:{path}` | 1分钟 |

## 验收标准

- [ ] `prisma/schema.prisma` 包含所有独立模型（不少于20个），没有 DynamicRecord
- [ ] 所有 enum 类型正确定义
- [ ] 所有 @relation 关联关系和外键约束正确
- [ ] 所有 @@index 和 @@unique 约束生效
- [ ] `npx prisma migrate dev` 执行成功
- [ ] `npx prisma generate` 执行成功
- [ ] Redis 连接配置完成，可正常连接
- [ ] 所有 Service 文件使用 Prisma Client，不存在 InMemoryModel 引用
- [ ] `src/constants/inmemory-db.ts` 已删除
- [ ] `src/models/*.model.ts` 空文件已删除
- [ ] 所有接口在 Postman 或 curl 测试下正常返回数据
