# Stage 0：技术架构定义

> 前端技术栈以 `.cursor/agents/01-前端开发工程师.md` 为基准。

## 0.1 技术栈

| 层级 | 技术 | 版本策略 |
|------|------|----------|
| Frontend | Vue 3, Vite, Element Plus, Axios, Echarts | LTS |
| 脚本 | `<script setup>` 组合式 API | — |
| State | Pinia | — |
| 路由 | vue-router + 路由守卫 | — |
| Backend | Node.js, NestJS, class-validator | LTS |
| ORM | Prisma | — |
| Auth | JWT Access + Refresh Token | — |
| Database | PostgreSQL 16 | — |
| Infra | Docker, Docker Compose, Nginx, GitHub Actions | — |
| Deploy | Nginx 静态托管 web dist；Railway/Render (api) | 可替换 |

## 0.2 系统架构图（文字版）

```text
[Browser: 総務担当者 / 管理者]（PC 桌面端）
        │
        ▼ HTTPS
┌───────────────────┐
│  Vue3 SPA         │  apps/web — Element Plus、vue-router、Axios
│  (Vite build)     │  RBAC 路由守卫、Echarts 仪表盘
└─────────┬─────────┘
          │ REST JSON (Bearer JWT)
          ▼
┌───────────────────┐
│  NestJS (apps/api)  │  Modules: auth, employees, dorms, rooms,
│                     │  occupancy, fees, vacancies, equipment,
│                     │  import, audit
└─────────┬─────────┘
          │ Prisma
          ▼
┌───────────────────┐
│  PostgreSQL       │  业务数据 + audit_logs
└───────────────────┘

[一次性/定期] Excel (.xlsx) ──upload──► Import Module ──► DB
```

## 0.3 部署架构

```text
                    ┌─────────────┐
                    │   GitHub    │
                    │   Actions   │
                    └──────┬──────┘
                           │ CI: lint, test, build
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ Nginx/CDN  │   │ Railway/   │   │ Managed    │
   │ apps/web   │   │ Render api │   │ PostgreSQL │
   │ (dist/)    │   │            │   │            │
   └────────────┘   └────────────┘   └────────────┘
```

生产环境建议：`api` 与 `db` 同区域（东京），降低延迟。

## 0.4 Monorepo 结构

```text
dormitory-management/
├── apps/
│   ├── web/                     # Vue3 + Vite 管理画面
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   └── src/
│   │       ├── api/
│   │       ├── assets/
│   │       ├── components/
│   │       ├── layout/
│   │       ├── router/
│   │       ├── store/
│   │       ├── utils/
│   │       ├── views/
│   │       │   ├── login/
│   │       │   ├── dashboard/
│   │       │   ├── employees/
│   │       │   ├── dorms/
│   │       │   ├── occupancy/
│   │       │   ├── fees/
│   │       │   ├── vacancies/
│   │       │   ├── equipment/
│   │       │   ├── import/
│   │       │   ├── audit/
│   │       │   └── settings/
│   │       ├── App.vue
│   │       └── main.js
│   └── api/                     # NestJS
│       ├── src/
│       │   ├── main.ts
│       │   ├── prisma/
│       │   └── modules/
│       └── prisma/
│           └── schema.prisma
├── docs/
├── dom-dev/doc/                 # 详细设计与前端模块
├── docker-compose.yml
├── .env.example
└── package.json                 # pnpm workspace
```

## 0.5 API 风格

- Base URL：`/api/v1`
- 认证：`Authorization: Bearer <access_token>`
- 响应包装：`{ code: 0, message, data }`
- 分页：`?page=1&pageSize=20`；`data: { items, total, page, pageSize }`
- 日期：`YYYY-MM-DD`（Asia/Tokyo）
- 软删除：默认 `deleted_at IS NULL`

## 0.6 状态管理方案（Frontend）

| 场景 | 方案 |
|------|------|
| 服务端列表数据 | 页面 `fetchList` + Axios；可选 composable |
| 全局 UI / 用户 | Pinia（`user`, `app`） |
| 表单 | Element Plus `el-form` + rules |
| 权限 | JWT + 路由 meta + `v-permission` 指令 |
| 图表 | Echarts 组件（Dashboard） |

## 0.7 权限方案

- RBAC：见 `stage-2-users-rbac.md`
- NestJS：`PermissionsGuard`
- 前端：`router.beforeEach` + `v-permission`

## 0.8 环境变量规范

见 `.env.example`：`VITE_API_BASE_URL`（前端）、`DATABASE_URL`、`JWT_*`（API）。

## 0.9 关键业务实现位置

| 业务规则 | 实现层 |
|----------|--------|
| 入居期间不重叠 | `OccupancyService.validateNoOverlap()` |
| 性别与寮种别一致 | `OccupancyService.validateGenderMatch()` |
| 初回入寮日 | `employees.first_dorm_use_date` |
| 寮費日割り | `FeeCalculationService` |
| 空き室判定 | `VacancyService` |
| Excel 导入 | `ImportService` |

## 0.10 前端开发智能体

编码阶段前端任务统一由 **01-前端开发工程师**（`.cursor/agents/01-前端开发工程师.md`）执行；业务细节见 `dom-dev/doc/详细设计/前端模块/`。
