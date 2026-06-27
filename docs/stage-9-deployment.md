# Stage 9：部署与运维

## 9.1 环境划分

| 环境 | 用途 | DB |
|------|------|-----|
| local | 开发 | Docker PostgreSQL |
| staging | 验收 / Excel 迁移演练 | 独立实例 |
| production | 本番 | 托管 PostgreSQL + 每日备份 |

## 9.2 本地开发（推荐）

Monorepo 根目录：

```bash
# 1. 仅数据库 + Adminer（默认 compose）
npm run db:up

# 2. 迁移 + 种子数据（根目录 npm scripts，不依赖 pnpm workspace）
npm run db:setup

# 3. 分别启动 API / Web（热重载）
npm run dev:api    # http://localhost:3001/api/v1
npm run dev:web    # http://localhost:3000（Vite 代理 /api/v1 → 3001）
```

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | `localhost:5432` | 用户/库：`dorm` / `dormitory` |
| Adminer | http://localhost:8080 | DB 可视化 |
| API | http://localhost:3001/api/v1 | NestJS |
| Web | http://localhost:3000 | Vue3 + Vite |

默认管理员：`admin@example.com` / `Admin123!!`（见 `apps/api/prisma/seed.ts`）

## 9.3 Dockerfile（API）

仓库内已提供 `apps/api/Dockerfile`（npm workspace 单应用构建）：

- 构建阶段：`npm ci` → `prisma generate` → `nest build`
- 运行阶段：`docker-entrypoint.sh` 自动执行 `prisma migrate deploy` 后启动 `node dist/main.js`

## 9.4 Dockerfile（Web — Vue3 SPA）

仓库内已提供 `apps/web/Dockerfile` + `apps/web/nginx.conf`：

- 构建时 `VITE_API_BASE_URL=/api/v1`（容器内由 Nginx 反代到 `api:3001`）
- Nginx：`try_files` SPA fallback + `/api/v1/` → `http://api:3001/api/v1/`

## 9.5 docker-compose.yml（两种模式）

根目录 `docker-compose.yml` 使用 **profile** 区分场景：

### 模式 A：仅数据库（日常开发，默认）

```bash
npm run db:up
# 等价于 docker compose up -d postgres adminer
```

| 服务 | 端口 |
|------|------|
| `postgres` | 5432 |
| `adminer` | 8080 |

### 模式 B：全栈容器演示（`full` profile）

```bash
npm run docker:full
# 等价于 docker compose --profile full up -d --build
```

| 服务 | 端口 | 说明 |
|------|------|------|
| `postgres` | 5432 | 数据库 |
| `adminer` | 8080 | DB 管理 |
| `api` | 3001 | 自动 migrate + 启动 |
| `web` | 3000 | Nginx 静态 + API 反代 |

停止全栈：`npm run docker:down`

> **注意**：模式 B 与本地 `npm run dev:api` 同时占用 3001 时会冲突，请先停掉其一。

## 9.6 GitHub Actions（CI — 已实现）

仓库内 `.github/workflows/ci.yml` 在 `push`/`pull_request`（`main`、`develop`）时执行：

| 步骤 | 说明 |
|------|------|
| PostgreSQL 16 service | 测试库 `dormitory_test` |
| `apps/api` | `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` |
| `apps/web` | `npm ci` → `npm run build` |

> 当前 CI **不含** lint / 单元测试 / E2E（待 T-080/T-081 实施后扩展）。

**CD（计划中）**：
- `main` 推送 → Nginx/CDN 部署 `apps/web`（`dist/` 静态资源）
- `main` 推送 → Railway/Render 部署 `apps/api` + 运行 `prisma migrate deploy`

## 9.7 部署步骤（首次本番）

1. 创建 PostgreSQL，记录 `DATABASE_URL`
2. 配置 API 环境变量（见 `.env.example`）
3. `pnpm --filter api exec prisma migrate deploy`
4. 运行 seed 创建 Admin 账号
5. 部署 API，健康检查 `GET /api/v1/health`
6. 部署 Web，设置 `VITE_API_BASE_URL`
7. 総務担当执行 Excel 导入（staging 先演练）
8. 验证入居登记与空き室画面
9. 配置 DB 自动备份（保留 ≥ 5 年策略由 DBA 归档）

## 9.8 运维检查清单

| 项 | 频率 |
|----|------|
| DB 备份成功 | 每日 |
| 磁盘 / 连接数 | 每周 |
| 依赖安全扫描 | 每周 CI |
| 审计日志抽检 | 每月 |
| 长期利用警告名单复核 | 每月 |

## 9.9 健康检查与监控

- `GET /api/v1/health` → `{ "status": "ok", "db": "connected" }`（DB 异常时为 `"disconnected"`）
- 日志：结构化 JSON（pino）
- MVP 可选：Sentry 前端 + 后端

## 9.10 回滚策略

- Web：Nginx 上一版本 `dist/` 回滚（或 CDN 缓存刷新）
- API：Railway 上一镜像；DB migration 仅向前，回滚用新 migration 修复
- 导入失败：依赖事务全回滚，无脏数据
