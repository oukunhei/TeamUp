# TeamUp - 大学生小组作业组队平台

> 一个创意驱动的大学生组队平台，让"有想法的人"与"有技能的人"高效匹配。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![English](https://img.shields.io/badge/📖_English_Document-Click_to_Switch-blue)](README.md)

## 核心特性

- **创意广场** - 浏览和发布项目创意，快速找到感兴趣的团队
- **双向筛选** - 申请后获得只读权限，双方确认后再正式组队
- **时间戳存证** - 创意发布即生成不可篡改的 SHA256 证书，保护原创性
- **文档版本控制** - 自动归档历史版本，支持一键回滚
- **双轨空间** - 开放空间（自由组队）+ 课程空间（教师管理）
- **权限分层** - 公开概述 / 只读详情 / 编辑上传 三级权限

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| **前端** | React 19 + TypeScript + Vite + Tailwind CSS + Zustand |
| **后端** | Node.js + Express + TypeScript + Prisma |
| **数据库** | PostgreSQL (主) + Redis (缓存/会话) |
| **文件存储** | 本地文件系统（兼容 S3/MinIO） |
| **容器化** | Docker + Docker Compose |

## 项目结构

```
.
├── client/                 # 前端 React 应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── services/      # API 请求封装
│   │   ├── stores/        # 状态管理 (Zustand)
│   │   └── types/         # TypeScript 类型定义
│   └── package.json
├── server/                 # 后端 API 服务
│   ├── src/
│   │   ├── modules/       # 业务模块
│   │   ├── middleware/    # 中间件
│   │   └── config/        # 配置文件
│   ├── prisma/            # Prisma Schema & 迁移
│   └── package.json
├── docs/                   # 设计文档
│   └── SYSTEM_DESIGN.md   # 系统设计文档
├── docker-compose.yml      # Docker Compose 配置
└── README.md              # 英文版 README
```

## 快速开始

### 方式一：Docker Compose（推荐）

一键启动全部服务：

```bash
# 克隆项目
git clone <repository-url>
cd teamup

# 启动所有服务
docker-compose up -d

# server 容器会自动执行 prisma migrate dev

# 访问
# 前端: http://localhost:5173
# 后端 API: http://localhost:3000
# MinIO 控制台: http://localhost:9001 (minioadmin/minioadmin)
```

### 方式二：本地开发

#### 1. 启动依赖服务

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

#### 2. 配置后端

```bash
cd server

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env
# 编辑 .env 中的数据库连接等配置

# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev --name init

# 启动开发服务器
npm run dev
```

#### 3. 配置前端

```bash
cd client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

## 环境变量

### 后端 (`server/.env`)

```env
# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/teamup?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# 文件存储（本地开发可保持默认）
STORAGE_ENDPOINT="localhost"
STORAGE_PORT=9000
STORAGE_USE_SSL=false
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="minioadmin"
STORAGE_BUCKET="teamup"

# 服务器
PORT=3000
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

## API 概览

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **认证** | | | |
| 注册 | POST | `/api/auth/register` | 邮箱/学号注册 |
| 登录 | POST | `/api/auth/login` | 返回 JWT |
| 刷新 | POST | `/api/auth/refresh` | 刷新 Access Token |
| **用户** | | | |
| 获取资料 | GET | `/api/users/me` | 当前用户信息 |
| 更新资料 | PATCH | `/api/users/me` | 修改资料、技能标签 |
| **空间** | | | |
| 创建空间 | POST | `/api/spaces` | 创建课程/开放空间 |
| 列表 | GET | `/api/spaces` | 我参与的空间 |
| 加入空间 | POST | `/api/spaces/:id/join` | 通过邀请码加入 |
| **创意** | | | |
| 发布 | POST | `/api/ideas` | 创建新创意 |
| 广场列表 | GET | `/api/ideas` | 公开创意卡片列表 |
| 详情 | GET | `/api/ideas/:id` | 创意详情（权限控制） |
| 发布 | POST | `/api/ideas/:id/publish` | 草稿→公开 |
| **申请** | | | |
| 申请加入 | POST | `/api/applications` | 向创意发送加入申请 |
| 审批 | PATCH | `/api/applications/:id` | 通过/拒绝/给只读权限 |
| 升级成员 | POST | `/api/applications/:id/promote` | Viewer 升级为核心成员 |
| **文档** | | | |
| 上传 | POST | `/api/documents` | 上传新版本（自动归档旧版） |
| 列表 | GET | `/api/ideas/:id/documents` | 创意的文档列表 |
| 历史版本 | GET | `/api/documents/:id/versions` | 文档的版本历史 |
| 回滚 | POST | `/api/documents/:id/rollback` | 回滚到指定版本 |
| **时间戳** | | | |
| 证书 | GET | `/api/timestamps/:hash` | 查看创意证书 |
| 验证 | POST | `/api/timestamps/verify` | 验证时间戳 |

## 数据库设计

详见 `server/prisma/schema.prisma`，核心实体包括：

- **User** - 用户系统
- **Space** - 空间（开放/课程）
- **Idea** - 创意（含时间戳 Hash）
- **Application** - 加入申请（支持只读权限）
- **Document** - 文档（当前版本）
- **DocumentVersion** - 文档版本历史
- **Notification** - 通知系统

## 部署指南

### 生产环境部署

```bash
# 1. 构建前端
cd client
npm install
npm run build
# 构建产物在 client/dist/

# 2. 构建后端
cd ../server
npm install
npm run build
# 构建产物在 server/dist/

# 3. 使用 PM2 启动后端
npm install -g pm2
pm2 start dist/index.js --name teamup-server

# 4. 使用 Nginx 托管前端静态文件并反向代理 API
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/teamup/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 开发指南

### 后端开发

```bash
cd server

# 数据库迁移
npx prisma migrate dev --name <migration-name>

# Prisma Studio（可视化数据库管理）
npx prisma studio

# 生成种子数据（可选）
npx tsx prisma/seed.ts
```

### 前端开发

```bash
cd client

# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 系统架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│   React SPA  │◄────►│  Nginx/     │◄────►│  Node.js API    │
│  (Vite构建)  │      │  Vercel CDN │      │  (Express + TS) │
└─────────────┘      └─────────────┘      └────────┬────────┘
                                                    │
                           ┌────────────────────────┼────────────────────────┐
                           │                        │                        │
                           ▼                        ▼                        ▼
                    ┌─────────────┐        ┌─────────────┐        ┌─────────────────┐
                    │  PostgreSQL │        │    Redis    │        │  MinIO / S3     │
                    │  (主数据库)  │        │ (缓存/会话)  │        │  (文件存储)      │
                    └─────────────┘        └─────────────┘        └─────────────────┘
```

## 开源协议

[MIT License](LICENSE)

## 相关文档

- [English README](README.md) — English version
- [System Design](docs/SYSTEM_DESIGN.md) — 详细系统设计文档
