# TeamUp - College Team Formation Platform

> An idea-driven team formation platform for college students, connecting "idea generators" with "skilled contributors" efficiently.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![中文文档](https://img.shields.io/badge/📖_中文文档-点击切换-blue)](README.zh-CN.md)

## Features

- **Idea Hub** — Browse and publish project ideas to find teams quickly
- **Mutual Screening** — Apply for read-only access first, both sides confirm before formal teaming
- **Timestamp Proof** — SHA256 certificate generated upon idea publication to protect originality
- **Document Versioning** — Automatic archival of historical versions with one-click rollback
- **Dual-track Spaces** — Open Space (free teaming) + Course Space (instructor-managed)
- **Tiered Permissions** — Public summary / Read-only detail / Edit & upload

## Tech Stack

| Layer | Technology |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + Zustand |
| **Backend** | Node.js + Express + TypeScript + Prisma |
| **Database** | PostgreSQL (primary) + Redis (cache/session) |
| **File Storage** | Local filesystem (S3/MinIO compatible) |
| **Containerization** | Docker + Docker Compose |

## Project Structure

```
.
├── client/                 # Frontend React App
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Shared components
│   │   ├── services/      # API client
│   │   ├── stores/        # State management (Zustand)
│   │   └── types/         # TypeScript definitions
│   └── package.json
├── server/                 # Backend API Service
│   ├── src/
│   │   ├── modules/       # Business modules
│   │   ├── middleware/    # Express middleware
│   │   └── config/        # Config files
│   ├── prisma/            # Prisma Schema & Migrations
│   └── package.json
├── docs/                   # Design docs
│   └── SYSTEM_DESIGN.md   # System design document (Chinese)
├── docker-compose.yml      # Docker Compose config
└── README.md              # This file
```

## Quick Start

### Option 1: Docker Compose (Recommended)

Start all services with one command:

```bash
# Clone the repo
git clone https://github.com/oukunhei/TeamUp.git
cd teamup

# Start all services
docker-compose up -d

# The server container will auto-run prisma migrate dev

# Access
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
```

### Option 2: Local Development

#### 1. Start Dependencies

```bash
# PostgreSQL
docker run -d --name teamup-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=teamup \
  -p 5432:5432 postgres:15-alpine

# Redis
docker run -d --name teamup-redis \
  -p 6379:6379 redis:7-alpine
```

#### 2. Setup Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env for your environment

npx prisma generate
npx prisma migrate dev --name init

npm run dev
```

#### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

#### 4. Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Environment Variables

### Backend (`server/.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/teamup?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# File Storage
STORAGE_ENDPOINT="localhost"
STORAGE_PORT=9000
STORAGE_USE_SSL=false
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="minioadmin"
STORAGE_BUCKET="teamup"

# Server
PORT=3000
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

## API Overview

| Resource | Method | Path | Description |
|------|------|------|------|
| **Auth** | | | |
| Register | POST | `/api/auth/register` | Email/student ID registration |
| Login | POST | `/api/auth/login` | Returns JWT |
| Refresh | POST | `/api/auth/refresh` | Refresh access token |
| **User** | | | |
| Get Profile | GET | `/api/users/me` | Current user info |
| Update Profile | PATCH | `/api/users/me` | Edit profile & skills |
| **Space** | | | |
| Create Space | POST | `/api/spaces` | Create open/course space |
| List | GET | `/api/spaces` | My spaces |
| Join Space | POST | `/api/spaces/:id/join` | Join via invite code |
| **Idea** | | | |
| Create | POST | `/api/ideas` | Create new idea |
| List | GET | `/api/ideas` | Public idea cards |
| Detail | GET | `/api/ideas/:id` | Idea detail (permission-aware) |
| Publish | POST | `/api/ideas/:id/publish` | Draft → public |
| **Application** | | | |
| Apply | POST | `/api/applications` | Send join request |
| Review | PATCH | `/api/applications/:id` | Approve/Reject/Grant viewer access |
| Promote | POST | `/api/applications/:id/promote` | Viewer → core member |
| **Document** | | | |
| Upload | POST | `/api/documents` | Upload new version (auto-archives old) |
| List | GET | `/api/ideas/:id/documents` | Idea's documents |
| Versions | GET | `/api/documents/:id/versions` | Version history |
| Rollback | POST | `/api/documents/:id/rollback` | Rollback to version |
| **Timestamp** | | | |
| Certificate | GET | `/api/timestamps/:hash` | View idea certificate |
| Verify | POST | `/api/timestamps/verify` | Verify timestamp |

## Database Design

See `server/prisma/schema.prisma` for the full schema. Core entities:

- **User** — User accounts
- **Space** — Open / Course spaces
- **Idea** — Ideas (with SHA256 timestamp hash)
- **Application** — Join requests (supports read-only viewer access)
- **Document** — Current document version
- **DocumentVersion** — Historical document versions
- **Notification** — Notification system

## Deployment

### Production Build

```bash
# 1. Build frontend
cd client
npm install
npm run build

# 2. Build backend
cd ../server
npm install
npm run build

# 3. Start backend with PM2
npm install -g pm2
pm2 start dist/index.js --name teamup-server

# 4. Serve frontend static files with Nginx
```

### Nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/teamup/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development

### Backend

```bash
cd server

# Database migration
npx prisma migrate dev --name <migration-name>

# Prisma Studio (visual DB management)
npx prisma studio

# Seed data (optional)
npx tsx prisma/seed.ts
```

### Frontend

```bash
cd client

# Dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│   React SPA  │◄────►│  Nginx/     │◄────►│  Node.js API    │
│  (Vite)      │      │  CDN        │      │  (Express + TS) │
└─────────────┘      └─────────────┘      └────────┬────────┘
                                                    │
                           ┌────────────────────────┼────────────────────────┐
                           │                        │                        │
                           ▼                        ▼                        ▼
                    ┌─────────────┐        ┌─────────────┐        ┌─────────────────┐
                    │  PostgreSQL │        │    Redis    │        │  MinIO / S3     │
                    │  (Primary)  │        │ (Cache)      │        │  (File Storage) │
                    └─────────────┘        └─────────────┘        └─────────────────┘
```

## License

[MIT License](LICENSE)

## Documentation

- [中文文档](README.zh-CN.md) — 中文版 README
- [System Design](docs/SYSTEM_DESIGN.md) — Detailed system design (Chinese)
