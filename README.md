# Pixora Community

一个全程由 AI 开发的全栈编程社区 + UI 组件库平台。

## 项目简介

Pixora 包含两个核心产品：

- **社区论坛** - 面向开发者的技术交流平台，支持论坛、问答、博客、项目展示等
- **UI 组件库** - 在线预览、发布和 Fork UI 组件，支持 CSS / Tailwind / React / Vue / Svelte

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite |
| 后台管理 | React 19 + Ant Design |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 实时通信 | Socket.IO |
| 认证 | JWT + GitHub OAuth |

## 项目结构

```
pixora-community/
├── 前端/              # 社区前端 (port 3302)
├── 组件广场/          # 组件库前端 (port 3303)
├── 后台管理/          # 管理后台 (port 3301)
└── 后端/
    └── server/        # API 服务 (port 3300)
```

## 功能特性

### 社区
- 论坛发帖 / 回复 / 点赞 / 收藏
- 技术问答（采纳最佳答案）
- 技术博客
- 项目展示
- 实时私信 + 消息通知
- GitHub 第三方登录
- AI 内容审核（敏感词过滤）
- 排行榜与积分系统

### 组件库
- 70+ 精美 UI 组件
- 在线实时预览
- 一键 Fork / 收藏 / 点赞
- 支持 CSS / Tailwind / React / Vue / Svelte
- 版本管理

### 后台管理
- 数据仪表盘
- 用户管理
- 内容审核
- 站点设置（Logo、Favicon、联系方式等动态配置）
- IP 管理

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- pnpm / npm / yarn

### 1. 克隆项目

```bash
git clone https://github.com/adminhuan/pixora-community.git
cd pixora-community
```

### 2. 后端

```bash
cd 后端/server
cp .env.example .env
# 编辑 .env 填入你的数据库连接和密钥

npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. 前端（社区）

```bash
cd 前端/app
npm install
npm run dev
```

### 4. 组件广场

```bash
cd 组件广场/app
npm install
npm run dev
```

### 5. 后台管理

```bash
cd 后台管理/app
npm install
npm run dev
```

## 环境变量

参考 `后端/server/.env.example` 配置：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `JWT_ACCESS_SECRET` | JWT 签名密钥 |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret |
| `SMTP_*` | 邮件服务配置 |

## 部署

项目支持 Nginx 反向代理部署：

- `pixora.vip` - 社区前端
- `ui.pixora.vip` - 组件广场
- `pixora.vip/admin` - 后台管理
- `pixora.vip/api/v1/` - 后端 API

生产环境使用 PM2 管理后端进程：

```bash
cd 后端/server
npm run build
pm2 start dist/server.js --name pixora-server
```

## 开源协议

[MIT License](./LICENSE)

## 致谢

本项目全程由 AI 辅助开发完成。
