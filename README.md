<p align="center">
  <h1 align="center">Pixora Community</h1>
  <p align="center">A full-stack developer community + UI component library, entirely built by AI</p>
  <p align="center">
    <a href="https://pixora.vip">Community Forum</a> |
    <a href="https://ui.pixora.vip">UI Components</a> |
    <a href="./README.zh-CN.md">中文文档</a> |
    <a href="https://github.com/adminhuan/pixora-community/issues">Feedback</a>
  </p>
</p>

---

## About

**Pixora** is a developer-oriented platform with two core products:

- **[pixora.vip](https://pixora.vip)** — Community forum with discussions, Q&A, blogs, project showcase, real-time messaging and more
- **[ui.pixora.vip](https://ui.pixora.vip)** — UI component library with 70+ components, live preview, one-click fork and publishing

The entire project — database design, backend APIs, frontend pages, and server deployment — was **built entirely by AI**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Admin Panel** | React 19 + Ant Design |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Real-time** | Socket.IO (WebSocket) |
| **Auth** | JWT + GitHub OAuth 2.0 |
| **Deployment** | Nginx + PM2 + Ubuntu |

## Project Structure

```
pixora-community/
├── frontend/                # Community forum frontend
│   └── app/                 # React app (port 3302)
├── component-plaza/         # UI component library frontend
│   └── app/                 # React app (port 3303)
├── admin/                   # Admin dashboard
│   └── app/                 # React + Ant Design app (port 3301)
├── backend/
│   └── server/              # Express API server (port 3300)
│       ├── prisma/          # Database models & migrations
│       ├── src/
│       │   ├── controllers/ # Route controllers
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Auth / rate limiting / CSRF
│       │   ├── routes/      # Route definitions
│       │   └── utils/       # Utility functions
│       └── .env.example     # Environment variable template
├── README.md                # English documentation
└── README.zh-CN.md          # Chinese documentation
```

## Features

### Community Forum (pixora.vip)

- **Forum** — Post / reply / like / bookmark / vote, Markdown editor support
- **Q&A** — Ask questions, submit answers, accept best answers
- **Blog** — Personal tech blog publishing with rich text editor
- **Project Showcase** — Share open source projects with GitHub repo links
- **Real-time Messaging** — WebSocket-powered instant private messaging
- **Notifications** — Real-time alerts for replies, likes, follows and more
- **GitHub Login** — One-click OAuth login, no registration needed
- **Leaderboard & Points** — Activity rankings to encourage community contribution
- **AI Moderation** — Sensitive word filtering to maintain a healthy community
- **Dark Mode** — Light and dark theme switching

### UI Component Library (ui.pixora.vip)

- **70+ Components** — Buttons, cards, loaders, inputs, toggles, forms, modals and more
- **Live Preview** — View component effects directly in the browser
- **One-click Fork** — Fork any component to your own account and modify it
- **Multi-framework** — CSS / Tailwind / React / Vue / Svelte
- **Version History** — Track component iteration history
- **Like & Bookmark** — Discover and save quality components
- **Category Browsing** — Buttons, cards, loaders, inputs, toggles, checkboxes, forms, alerts, modals, navbars, footers, patterns and more

### Admin Dashboard

- **Analytics** — User growth, content publishing, page views and core metrics
- **User Management** — User list, ban/unban, role assignment
- **Content Moderation** — Review posts, comments and components
- **Site Settings** — Dynamically configure logo, favicon, site name, contact info and more
- **IP Management** — Access logs and IP blocking

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm / pnpm / yarn

### 1. Clone

```bash
git clone https://github.com/adminhuan/pixora-community.git
cd pixora-community
```

### 2. Backend

```bash
cd backend/server

# Copy and configure environment variables
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma Client and sync database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### 3. Community Frontend

```bash
cd frontend/app
npm install
npm run dev
# Runs on http://localhost:3302
```

### 4. Component Library

```bash
cd component-plaza/app
npm install
npm run dev
# Runs on http://localhost:3303
```

### 5. Admin Panel (Optional)

```bash
cd admin/app
npm install
npm run dev
# Runs on http://localhost:3301
```

## Environment Variables

Copy `backend/server/.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | JWT access token signing key |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token signing key |
| `CORS_ORIGINS` | Yes | Allowed frontend origins, comma-separated |
| `BASE_URL` | Yes | Public backend URL |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth App Client Secret |
| `SMTP_HOST` | No | Mail server host |
| `SMTP_USER` | No | Mail server username |
| `SMTP_PASS` | No | Mail server password |

> Tip: Generate JWT secrets with `openssl rand -hex 48`

## Production Deployment

### Nginx Reverse Proxy

```nginx
# Community Forum
server {
    listen 80;
    server_name pixora.vip;

    location / {
        root /var/www/pixora/frontend;
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

# Component Library
server {
    listen 80;
    server_name ui.pixora.vip;

    location / {
        root /var/www/pixora/component-plaza;
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3300;
    }
}
```

### PM2

```bash
cd backend/server
npm run build
pm2 start dist/server.js --name pixora-server
```

## Live Demo

| Service | URL |
|---------|-----|
| Community Forum | [https://pixora.vip](https://pixora.vip) |
| UI Component Library | [https://ui.pixora.vip](https://ui.pixora.vip) |

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/xxx`)
3. Commit your changes (`git commit -m 'Add xxx'`)
4. Push to the branch (`git push origin feature/xxx`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](./LICENSE).
