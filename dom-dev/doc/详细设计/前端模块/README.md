# 寮管理システム — 前端模块设计索引

| 版本 | 2.1.0 |
| 日期 | 2026-05-27 |
| 技术栈 | **Vue3 + Vite + Element Plus + Axios + Echarts + Pinia** |
| 智能体 | `.cursor/agents/01-前端开发工程师.md` |

本目录与 `docs/stage-5-api-spec.md` 交叉校验，供 Stage 7 前端编码使用。

---

## 阅读顺序

1. [00-前端共通设计.md](./00-前端共通设计.md)
2. [13-布局与导航.md](./13-布局与导航.md)
3. [01-Auth](./01-Auth-认证登录.md) → [03-Dashboard](./03-Dashboard-仪表盘.md)
4. 业务模块 04 ~ 12

---

## 工程路径约定

| 类型 | 路径 |
|------|------|
| 页面 | `apps/web/src/views/<模块>/` |
| 接口 | `apps/web/src/api/<模块>.js` |
| 路由 | `apps/web/src/router/index.js` |
| 布局 | `apps/web/src/layout/index.vue` |

---

## 模块清单

| 序号 | 文档 | 路由 | API 文件 |
|------|------|------|----------|
| 00 | 前端共通 | — | `utils/request.js` |
| 13 | 布局导航 | router | — |
| 01 | Auth | `/login` | `auth.js` |
| 02 | Users | `/settings/users` | `users.js` |
| 03 | Dashboard | `/` | `dashboard.js` |
| 14 | 寮割カレンダー | `/allocation-calendar` | `calendar.js` |
| 04~12 | 业务模块 | 见各文档 | 见各文档 |

---

## v2.0 变更（对齐 01-前端开发工程师）

- Next.js / React / shadcn / TanStack → **Vue3 + Element Plus**
- fetch / React Query → **Axios + Pinia + fetchList**
- Zod → **el-form rules**
- 独立 /new 页 → **el-dialog CRUD**（向导类除外）
- `NEXT_PUBLIC_*` → **`VITE_API_BASE_URL`**

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 详细设计总览 | `../寮管理システム-详细设计书.md` |
| 架构 | `../../../../docs/stage-0-architecture.md` |
| API | `../../../../docs/stage-5-api-spec.md` |
| 页面 | `../../../../docs/stage-6-page-design.md` |
