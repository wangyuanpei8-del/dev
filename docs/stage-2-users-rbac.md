# Stage 2：用户与权限模型

## 2.1 系统用户类型

本系统为**内部管理后台**，终端用户为総務・寮管理相关人员，非入居社員本人。

| 角色代码 | 名称 | 说明 |
|----------|------|------|
| `SYSTEM_ADMIN` | 系统管理员 | 用户管理、主数据、导入、审计、全模块 |
| `DORM_MANAGER` | 寮管理员 | 日常入退寮、寮費确认、空き室、备品 |
| `VIEWER` | 只读用户 | 查询、导出，不可变更业务数据 |

## 2.2 用户表（应用账号）

| 字段 | 说明 |
|------|------|
| id | UUID |
| email | 登录邮箱 |
| password_hash | bcrypt |
| display_name | 显示名 |
| role | 枚举 |
| is_active | 是否启用 |
| last_login_at | 最后登录 |

## 2.3 RBAC 权限矩阵

| 模块 / 操作 | SYSTEM_ADMIN | DORM_MANAGER | VIEWER |
|-------------|:------------:|:------------:|:------:|
| 用户账号 CRUD | ✓ | — | — |
| 社員マスタ 查看 | ✓ | ✓ | ✓ |
| 社員マスタ 编辑 | ✓ | ✓ | — |
| 寮マスタ 查看 | ✓ | ✓ | ✓ |
| 寮マスタ 编辑 | ✓ | ✓ | — |
| 部屋マスタ 查看 | ✓ | ✓ | ✓ |
| 部屋マスタ 编辑 | ✓ | ✓ | — |
| 入退寮 查看 | ✓ | ✓ | ✓ |
| 入退寮 登记/修改/退寮 | ✓ | ✓ | — |
| 初回入寮日 查看 | ✓ | ✓ | ✓ |
| 初回入寮日 手工修正 | ✓ | — | — |
| 寮費 查看 | ✓ | ✓ | ✓ |
| 寮費 算定/确定 | ✓ | ✓ | — |
| 空き室 查看 | ✓ | ✓ | ✓ |
| 备品マスタ | ✓ | ✓ | 查看 |
| Excel 导入 | ✓ | ✓ | — |
| 操作ログ 查看 | ✓ | ✓ | — |
| 费率主数据 维护 | ✓ | — | — |

## 2.4 权限点（API / 前端共用）

```text
users:read, users:write
employees:read, employees:write
dorms:read, dorms:write
rooms:read, rooms:write
occupancy:read, occupancy:write
fees:read, fees:write, fees:confirm
vacancies:read
equipment:read, equipment:write
import:execute
audit:read
fee-rates:write          # 仅 ADMIN
```

## 2.5 角色与权限映射

| 角色 | permissions |
|------|-------------|
| SYSTEM_ADMIN | `*`（全部） |
| DORM_MANAGER | employees/dorms/rooms/occupancy/fees/vacancies/equipment/import 的 read+write；fees:confirm；无 users、audit、fee-rates |
| VIEWER | 所有 `:read` 权限 |

## 2.6 数据级访问

MVP 为单组织单租户，无 row-level 地域隔离。将来若需「大阪担当仅看大阪寮」，可在 `users` 增加 `allowed_location_ids`（Phase 2）。

## 2.7 认证流程

1. `POST /api/v1/auth/login` → access + refresh token  
2. Access 过期 → `POST /api/v1/auth/refresh`  
3. 前端 401 → 跳转登录  
4. 密码策略：最少 10 位，含字母与数字（可配置）
