<p align="center">
  <h1 align="center">Pixora Community</h1>
  <p align="center">全程由 AI 开发的全栈编程社区 + UI 组件库平台</p>
  <p align="center">
    <a href="https://pixora.vip">社区论坛</a> |
    <a href="https://ui.pixora.vip">UI 组件库</a> |
    <a href="https://github.com/adminhuan/pixora-community/issues">反馈建议</a>
  </p>
</p>

---

## 项目简介

**Pixora** 是一个面向开发者的技术交流平台，包含两个核心产品：

- **[pixora.vip](https://pixora.vip)** - 编程社区论坛，支持发帖讨论、技术问答、博客写作、项目展示、实时私信等
- **[ui.pixora.vip](https://ui.pixora.vip)** - UI 组件库，70+ 精美组件，在线实时预览，支持一键 Fork 和发布

整个项目从数据库设计、后端接口、前端页面到服务器部署，**全部由 AI 完成开发**。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Vite |
| **后台管理** | React 19 + Ant Design |
| **后端** | Node.js + Express + TypeScript |
| **数据库** | PostgreSQL + Prisma ORM |
| **实时通信** | Socket.IO (WebSocket) |
| **认证** | JWT + GitHub OAuth 2.0 |
| **部署** | Nginx + PM2 + Ubuntu |

## 项目结构

```
pixora-community/
├── 前端/                  # 社区论坛前端
│   └── app/               # React 应用 (port 3302)
├── 组件广场/              # UI 组件库前端
│   └── app/               # React 应用 (port 3303)
├── 后台管理/              # 管理后台
│   └── app/               # React + Ant Design 应用 (port 3301)
├── 后端/
│   └── server/            # Express API 服务 (port 3300)
│       ├── prisma/        # 数据库模型 & 迁移
│       ├── src/
│       │   ├── controllers/   # 路由控制器
│       │   ├── services/      # 业务逻辑层
│       │   ├── middleware/    # 中间件（认证/限流/CSRF）
│       │   ├── routes/        # 路由定义
│       │   └── utils/         # 工具函数
│       └── .env.example       # 环境变量模板
└── README.md
```

## 功能特性

### 社区论坛 (pixora.vip)

- **论坛讨论** - 发帖 / 回复 / 点赞 / 收藏 / 投票，支持 Markdown 编辑器
- **技术问答** - 提问 / 回答 / 采纳最佳答案，帮助开发者解决问题
- **技术博客** - 个人博客发布与阅读，支持富文本编辑
- **项目展示** - 展示个人开源项目，支持 GitHub 仓库链接
- **实时私信** - 基于 WebSocket 的实时聊天，消息即时送达
- **消息通知** - 回复、点赞、关注等操作的实时提醒
- **GitHub 登录** - 一键 OAuth 授权登录，无需注册
- **排行榜 & 积分** - 活跃度排行，鼓励社区贡献
- **AI 内容审核** - 敏感词过滤，保障社区环境
- **暗色模式** - 支持明暗主题切换

### UI 组件库 (ui.pixora.vip)

- **70+ 精美组件** - 按钮、卡片、加载器、输入框、开关、表单、弹窗等全品类覆盖
- **在线实时预览** - 无需下载，浏览器内直接查看组件效果
- **一键 Fork** - 看到喜欢的组件可以直接 Fork 到自己名下修改
- **多框架支持** - CSS / Tailwind / React / Vue / Svelte 五种框架
- **版本管理** - 组件迭代历史可追溯
- **点赞 & 收藏** - 发现和收藏优质组件
- **分类浏览** - 按钮、卡片、加载器、输入框、开关、复选框、表单、提示、弹窗、导航栏、页脚、背景图案等分类

### 后台管理

- **数据仪表盘** - 用户增长、内容发布、访问量等核心数据可视化
- **用户管理** - 用户列表、封禁 / 解封、角色分配
- **内容审核** - 帖子 / 评论 / 组件审核，敏感内容过滤
- **站点设置** - Logo、Favicon、网站名称、联系方式等均可后台动态配置
- **IP 管理** - 访问记录与 IP 封禁

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- npm / pnpm / yarn

### 1. 克隆项目

```bash
git clone https://github.com/adminhuan/pixora-community.git
cd pixora-community
```

### 2. 启动后端

```bash
cd 后端/server

# 复制环境变量模板并填入配置
cp .env.example .env

# 安装依赖
npm install

# 生成 Prisma Client 并同步数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

### 3. 启动社区前端

```bash
cd 前端/app
npm install
npm run dev
# 默认运行在 http://localhost:3302
```

### 4. 启动组件广场

```bash
cd 组件广场/app
npm install
npm run dev
# 默认运行在 http://localhost:3303
```

### 5. 启动后台管理（可选）

```bash
cd 后台管理/app
npm install
npm run dev
# 默认运行在 http://localhost:3301
```

## 环境变量说明

复制 `后端/server/.env.example` 为 `.env` 并配置以下关键变量：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `JWT_ACCESS_SECRET` | 是 | JWT Access Token 签名密钥（随机字符串） |
| `JWT_REFRESH_SECRET` | 是 | JWT Refresh Token 签名密钥（随机字符串） |
| `CORS_ORIGINS` | 是 | 允许跨域的前端地址，逗号分隔 |
| `BASE_URL` | 是 | 后端服务的公开访问地址 |
| `GITHUB_CLIENT_ID` | 否 | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | 否 | GitHub OAuth App Client Secret |
| `SMTP_HOST` | 否 | 邮件服务器地址（用于发送验证邮件） |
| `SMTP_USER` | 否 | 邮件服务器账号 |
| `SMTP_PASS` | 否 | 邮件服务器密码 |

> 提示：可以使用 `openssl rand -hex 48` 生成 JWT 密钥

## 生产环境部署

### Nginx 反向代理参考

```nginx
# 社区论坛
server {
    listen 80;
    server_name pixora.vip;

    location / {
        root /var/www/pixora/前端;
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3300;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# 组件广场
server {
    listen 80;
    server_name ui.pixora.vip;

    location / {
        root /var/www/pixora/组件广场;
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3300;
    }
}
```

### PM2 启动后端

```bash
cd 后端/server
npm run build
pm2 start dist/server.js --name pixora-server
```

## 在线体验

| 服务 | 地址 |
|------|------|
| 社区论坛 | [https://pixora.vip](https://pixora.vip) |
| UI 组件库 | [https://ui.pixora.vip](https://ui.pixora.vip) |

## 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/xxx`)
3. 提交你的修改 (`git commit -m 'Add xxx'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

## 致谢

本项目全程由 AI 辅助开发完成，感谢开源社区的各种优秀工具和框架。
