# Stage X：开发任务拆解（Task Breakdown）

> **最后更新：2026-06-06**  
> **完成度**：Epic 1–8 业务任务 **已全部实现**；Epic 9 **已全部实现**（T-080/T-081/T-082 ✅）。

## 完成状态总览

| Epic | 范围 | 状态 |
|------|------|------|
| 1 | Monorepo + 骨架 | ✅ 完成 |
| 2 | 认证与权限 | ✅ 完成 |
| 3 | 主数据（社員・寮・部屋） | ✅ 完成 |
| 4 | 入退寮与约束 | ✅ 完成 |
| 5 | 寮費 | ✅ 完成 |
| 6 | 空き室 | ✅ 完成 |
| 7 | Excel 导入（含 CSV） | ✅ 完成 |
| 8 | 审计与备品 | ✅ 完成 |
| 9 | 测试与部署 | ✅ 完成 |

**额外已实现（原 backlog 未单列）**：Departments CRUD、Export CSV×3、寮割印刷 MVP、乐观锁 version、所属マスタ页面。

---

## Epic 1：项目基础架构

### Feature 1.1 Monorepo 初始化

**Story**：作为开发者，我需要 pnpm workspace + NestJS + Vue3/Vite 骨架，以便并行开发。

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-001 | ✅ | DevOps | 初始化 pnpm workspace、`apps/web`、`apps/api` | 无 | P0 | M |
| T-002 | ✅ | Backend | NestJS bootstrap、全局 ValidationPipe、统一响应拦截器 | T-001 | P0 | S |
| T-003 | ✅ | Backend | Prisma 接入 PostgreSQL、migrate 脚本 | T-001 | P0 | S |
| T-004 | ✅ | Frontend | Vue3 + Vite + Element Plus 基础布局（Sidebar、Axios、Pinia） | T-001 | P0 | M |

**验收**：`docker compose up` 可启动 db；`pnpm dev` 可同时起 web/api。✅

---

## Epic 2：认证与权限

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-010 | ✅ | Backend | auth module：login / refresh / bcrypt | T-003 | P0 | M |
| T-011 | ✅ | Backend | JWT Guard + Roles Guard + 权限装饰器 | T-010 | P0 | M |
| T-012 | ✅ | Frontend | 登录页 + Pinia token + Axios 拦截器 | T-004 | P0 | M |
| T-013 | ✅ | Frontend | vue-router 路由守卫 + v-permission | T-011, T-012 | P0 | S |

---

## Epic 3：主数据（社員・寮・部屋）

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-020 | ✅ | Backend | employees CRUD API | T-011 | P0 | M |
| T-021 | ✅ | Backend | dorms CRUD API（种别不可随意变更） | T-011 | P0 | M |
| T-022 | ✅ | Backend | rooms CRUD API | T-021 | P0 | M |
| T-023 | ✅ | Frontend | 社員・寮・部屋 一覧/表单页 | T-020-T-022 | P0 | L |

---

## Epic 4：入退寮与业务约束

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-030 | ✅ | Backend | occupancy_histories CRUD + 重叠校验 | T-022, T-020 | P0 | L |
| T-031 | ✅ | Backend | 性别匹配 + 户内 3 人上限校验 | T-030 | P0 | M |
| T-032 | ✅ | Backend | first_dorm_use_date 自动设定逻辑 | T-030 | P0 | M |
| T-033 | ✅ | Backend | 长期利用一覧 API（3 年阈值可配置） | T-032 | P1 | M |
| T-034 | ✅ | Frontend | 入居/退寮 登记向导 + 错误提示 | T-030 | P0 | L |

---

## Epic 5：寮費

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-040 | ✅ | Backend | fee_rates 主数据 API | T-011 | P0 | M |
| T-041 | ✅ | Backend | 月次算定 Service + dorm_fees API | T-030, T-040 | P0 | L |
| T-042 | ✅ | Backend | 确定状态 + 审计 | T-041 | P1 | S |
| T-043 | ✅ | Frontend | 寮費一覧・算定・根拠表示 | T-041 | P0 | M |

---

## Epic 6：空き室

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-050 | ✅ | Backend | VacancyService + 一覧 API | T-030 | P0 | M |
| T-051 | ✅ | Frontend | 空き室 Dashboard（按寮/性别筛选） | T-050 | P0 | M |

---

## Epic 7：Excel 导入

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-060 | ✅ | Backend | xlsx/csv 解析 + 列映射 DTO | T-030 | P0 | L |
| T-061 | ✅ | Backend | 预览 + 校验 + 事务导入 | T-060 | P0 | L |
| T-062 | ✅ | Frontend | 导入向导（上传→映射→预览→执行） | T-061 | P0 | L |

---

## Epic 8：审计与备品

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-070 | ✅ | Backend | audit_logs 拦截器 | T-011 | P0 | M |
| T-071 | ✅ | Backend | equipment + storage_locations CRUD | T-011 | P2 | S |
| T-072 | ✅ | Frontend | 操作ログ一覧 | T-070 | P1 | S |

---

## Epic 9：测试与部署

| ID | 状态 | 类型 | 描述 | 依赖 | 优先级 | 复杂度 |
|----|------|------|------|------|--------|--------|
| T-080 | ✅ | QA | Occupancy / Fee 单元测试 | T-030, T-041 | P0 | M |
| T-081 | ✅ | QA | E2E：登录→入居登记 | T-034 | P0 | M |
| T-082 | ✅ | DevOps | Docker + compose + GitHub Actions | T-001 | P0 | M |

---

## 开发顺序与依赖图

```text
T-001 → T-003 → T-010 → T-011
                 ↓
        T-020 / T-021 → T-022 → T-030 → T-031 → T-032
                              ↓
                         T-041, T-050
                              ↓
                         T-060 → T-061
```

**可并行**：T-023（前端主数据）与 T-030（后端入居）在 API 契约冻结后并行；T-062 与 T-043 并行。

**阻塞点**：T-030 完成前不可做 T-050、T-061。✅ 已解除

---

## 开发路线图（历史计划 — 已完成）

| Week | 目标 | 任务 | 状态 |
|------|------|------|------|
| W1 | 骨架 + 认证 + DB | T-001 ~ T-013, T-003 | ✅ |
| W2 | 主数据 | T-020 ~ T-023 | ✅ |
| W3 | 入退寮核心 | T-030 ~ T-034 | ✅ |
| W4 | 寮費 + 空室 | T-040 ~ T-051, T-033 | ✅ |
| W5 | Excel 导入 | T-060 ~ T-062 | ✅ |
| W6 | 审计 + 测试 + 部署 | T-070 ~ T-072, T-080 ~ T-082 | ✅ |

---

## 任务示例：T-030 详细

**输入**：rooms、employees、dorms 模块

**输出文件**：

- `apps/api/src/modules/occupancy/occupancy.module.ts`
- `apps/api/src/modules/occupancy/occupancy.service.ts`
- `apps/api/src/modules/occupancy/occupancy.controller.ts`

**验收标准**：

- POST 入居重叠返回 409 `OCCUPANCY_OVERLAP` ✅
- 性别不符返回 409 `GENDER_MISMATCH` ✅
- 单元测试 ≥6 个边界日期用例 ✅（`apps/api/src/**/*.spec.ts`）

**复杂度**：L — **已实现**
