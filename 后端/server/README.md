# AI 编程社区后端服务

## 技术栈

- Node.js 18+
- Express 4 + TypeScript 5（strict）
- PostgreSQL + Prisma（当前实现支持无 PostgreSQL 时降级为内存模型）
- Redis（缓存与 Token 黑名单）
- JWT 认证
- Swagger 文档（`/docs`）

## 目录说明

```text
server/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── docs/
├── .env.example
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 快速开始

```bash
cd 后端/server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

默认端口：`3300`

接口前缀：`/api/v1`

Swagger：`http://localhost:3300/docs`

健康检查：`GET /api/v1/health`

## 认证测试账号

当前开发环境可用账号：

- 管理员：`pm-admin@local.test / Test123456`
- 普通用户：`pm-demo@local.test / Test123456`

## 已实现模块

- 模块01：项目初始化与基础架构
- 模块03：用户认证接口
- 模块04：论坛帖子接口
- 模块05：代码分享接口
- 模块06：问答系统接口
- 模块07：项目展示接口
- 模块08：博客系统接口
- 模块09：评论系统接口
- 模块10：消息通知接口
- 模块11：搜索服务接口
- 模块12：文件上传接口
- 模块13：管理后台接口
- 模块14：用户资料接口
- 模块15：标签系统接口
- 模块16：排行榜与积分接口

## 校验命令

```bash
npm run lint
npm run build
```

## 生产运维脚本

已内置运维脚本目录：`scripts/`

- `scripts/backup.sh`：数据库 + 上传目录备份（默认保留 14 天）
- `scripts/health-check.sh`：进程在线、接口健康、磁盘占用巡检
- `scripts/ssl-check.sh`：HTTPS 证书有效期巡检

推荐 Crontab（生产）：

```bash
*/5 * * * * /opt/ai-community/后端/server/scripts/health-check.sh >> /opt/ai-community/后端/server/logs/ops-cron.log 2>&1
30 3 * * * /opt/ai-community/后端/server/scripts/backup.sh >> /opt/ai-community/后端/server/logs/ops-cron.log 2>&1
20 9 * * * /opt/ai-community/后端/server/scripts/ssl-check.sh >> /opt/ai-community/后端/server/logs/ops-cron.log 2>&1
```

Telegram 告警（可选）：

```bash
TELEGRAM_BOT_TOKEN=123456789:xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
# Topic 群组可选，不是 topic 群可留空
TELEGRAM_MESSAGE_THREAD_ID=
```

配置后，`health-check.sh` 与 `ssl-check.sh` 在 `WARN/ERROR` 时会自动推送到 Telegram。
